use rusqlite::{params, params_from_iter, types::Value as SqlValue, Connection};
use serde::Serialize;
use serde_json::{Map, Value};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};

const IMAGE_EXTS: &[&str] = &["jpg", "jpeg", "png", "webp", "bmp"];

#[derive(Serialize)]
pub struct OpenedDataset {
    images: Vec<String>,
    labels: HashMap<String, Value>,
    config: Option<Value>,
}

fn images_dir(dataset: &str) -> PathBuf {
    Path::new(dataset).join("images")
}

fn trash_dir(dataset: &str) -> PathBuf {
    Path::new(dataset).join(".trash")
}

fn db_path(dataset: &str) -> PathBuf {
    Path::new(dataset).join("attributes.db")
}

/// Recursively walk `dir`, appending each image file's path relative to `root`
/// (using forward slashes) to `out`.
fn collect_images(root: &Path, dir: &Path, out: &mut Vec<String>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let p = entry.path();
        if p.is_dir() {
            collect_images(root, &p, out)?;
            continue;
        }
        if !p.is_file() {
            continue;
        }
        let ext = p
            .extension()
            .and_then(|s| s.to_str())
            .map(|s| s.to_lowercase());
        let is_image = matches!(ext.as_deref(), Some(ex) if IMAGE_EXTS.contains(&ex));
        if !is_image {
            continue;
        }
        let rel = p.strip_prefix(root).map_err(|e| e.to_string())?;
        let rel_str = rel
            .components()
            .map(|c| c.as_os_str().to_string_lossy())
            .collect::<Vec<_>>()
            .join("/");
        out.push(rel_str);
    }
    Ok(())
}

fn is_valid_ident(s: &str) -> bool {
    let mut chars = s.chars();
    match chars.next() {
        Some(c) if c.is_ascii_alphabetic() || c == '_' => {}
        _ => return false,
    }
    chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
}

#[derive(Clone, Copy, Debug)]
enum AttrType {
    Single,
    Multi,
    Direction,
    Number,
}

impl AttrType {
    fn parse(s: &str) -> Option<Self> {
        match s {
            "single" => Some(Self::Single),
            "multi" => Some(Self::Multi),
            "direction" => Some(Self::Direction),
            "number" => Some(Self::Number),
            _ => None,
        }
    }
}

/// Returns map: attribute_key -> AttrType, for every valid attribute in config.
fn parse_attr_types(config: &Value) -> HashMap<String, AttrType> {
    let mut out = HashMap::new();
    let Some(attrs) = config.get("attributes").and_then(|v| v.as_array()) else {
        return out;
    };
    for a in attrs {
        let Some(key) = a.get("key").and_then(|v| v.as_str()) else {
            continue;
        };
        let Some(ty) = a.get("type").and_then(|v| v.as_str()).and_then(AttrType::parse) else {
            continue;
        };
        if !is_valid_ident(key) {
            eprintln!("skipping attribute with invalid key (must match [A-Za-z_][A-Za-z0-9_]*): {key}");
            continue;
        }
        out.insert(key.to_string(), ty);
    }
    out
}

fn open_db(dataset: &str) -> Result<Connection, String> {
    let conn = Connection::open(db_path(dataset)).map_err(|e| e.to_string())?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS images (image_file TEXT PRIMARY KEY NOT NULL);",
    )
    .map_err(|e| e.to_string())?;
    Ok(conn)
}

/// Add a column for every attribute key in `attr_types` that isn't already present.
fn sync_schema(
    conn: &Connection,
    attr_types: &HashMap<String, AttrType>,
) -> Result<(), String> {
    let mut existing: HashSet<String> = HashSet::new();
    let mut stmt = conn
        .prepare("PRAGMA table_info(images)")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| e.to_string())?;
    for r in rows {
        existing.insert(r.map_err(|e| e.to_string())?);
    }

    for (key, ty) in attr_types {
        if existing.contains(key) {
            continue;
        }
        let sql_type = match ty {
            AttrType::Single | AttrType::Multi => "TEXT",
            AttrType::Direction | AttrType::Number => "REAL",
        };
        // Safe: is_valid_ident validated earlier.
        let sql = format!("ALTER TABLE images ADD COLUMN {key} {sql_type}");
        conn.execute(&sql, []).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Encode a JSON value into a SQL value according to the attribute type.
fn value_to_sql(v: &Value, ty: AttrType) -> SqlValue {
    if v.is_null() {
        return SqlValue::Null;
    }
    match ty {
        AttrType::Single => match v.as_str() {
            Some(s) => SqlValue::Text(s.to_string()),
            None => SqlValue::Null,
        },
        AttrType::Multi => {
            // Always store as JSON array text.
            SqlValue::Text(v.to_string())
        }
        AttrType::Direction | AttrType::Number => match v.as_f64() {
            Some(f) => SqlValue::Real(f),
            None => SqlValue::Null,
        },
    }
}

/// Decode a SQL column back to a JSON value according to the attribute type.
fn sql_to_value(v: SqlValue, ty: AttrType) -> Value {
    match v {
        SqlValue::Null => Value::Null,
        SqlValue::Text(s) => match ty {
            AttrType::Multi => serde_json::from_str(&s).unwrap_or(Value::Null),
            _ => Value::String(s),
        },
        SqlValue::Real(f) => serde_json::Number::from_f64(f)
            .map(Value::Number)
            .unwrap_or(Value::Null),
        SqlValue::Integer(i) => Value::Number(i.into()),
        SqlValue::Blob(_) => Value::Null,
    }
}

/// Read all labeled rows into a map keyed by image_file. Skips the image_file column.
fn read_all_labels(
    conn: &Connection,
    attr_types: &HashMap<String, AttrType>,
) -> Result<HashMap<String, Value>, String> {
    let mut out = HashMap::new();
    let mut stmt = conn
        .prepare("SELECT * FROM images")
        .map_err(|e| e.to_string())?;
    let col_names: Vec<String> = stmt
        .column_names()
        .into_iter()
        .map(|s| s.to_string())
        .collect();

    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let mut image_file: Option<String> = None;
        let mut obj = Map::new();
        for (i, name) in col_names.iter().enumerate() {
            let raw: SqlValue = row.get(i).map_err(|e| e.to_string())?;
            if name == "image_file" {
                if let SqlValue::Text(s) = raw {
                    image_file = Some(s);
                }
                continue;
            }
            let Some(ty) = attr_types.get(name) else {
                // Column exists in DB but not in current config — surface it as-is.
                let v = sql_to_value(raw, AttrType::Single);
                if !v.is_null() {
                    obj.insert(name.clone(), v);
                }
                continue;
            };
            let v = sql_to_value(raw, *ty);
            if !v.is_null() {
                obj.insert(name.clone(), v);
            }
        }
        if let Some(name) = image_file {
            out.insert(name, Value::Object(obj));
        }
    }
    Ok(out)
}

#[tauri::command]
pub fn open_dataset(path: String) -> Result<OpenedDataset, String> {
    let images_path = images_dir(&path);
    if !images_path.is_dir() {
        return Err(format!("'images' subfolder not found under: {}", path));
    }

    let mut images: Vec<String> = Vec::new();
    collect_images(&images_path, &images_path, &mut images)?;
    images.sort();

    let config_path = Path::new(&path).join("config.json");
    let config = match fs::read_to_string(&config_path) {
        Ok(text) => match serde_json::from_str::<Value>(&text) {
            Ok(v) => Some(v),
            Err(e) => {
                eprintln!("config.json parse error: {e}");
                None
            }
        },
        Err(_) => None,
    };

    let attr_types = config
        .as_ref()
        .map(parse_attr_types)
        .unwrap_or_default();

    let conn = open_db(&path)?;
    sync_schema(&conn, &attr_types)?;
    let labels = read_all_labels(&conn, &attr_types)?;

    Ok(OpenedDataset {
        images,
        labels,
        config,
    })
}

#[tauri::command]
pub fn read_label(path: String, image_name: String) -> Result<Option<Value>, String> {
    let conn = open_db(&path)?;
    let config_path = Path::new(&path).join("config.json");
    let attr_types = match fs::read_to_string(&config_path)
        .ok()
        .and_then(|t| serde_json::from_str::<Value>(&t).ok())
    {
        Some(cfg) => parse_attr_types(&cfg),
        None => HashMap::new(),
    };
    sync_schema(&conn, &attr_types)?;

    let mut stmt = conn
        .prepare("SELECT * FROM images WHERE image_file = ?1")
        .map_err(|e| e.to_string())?;
    let col_names: Vec<String> = stmt
        .column_names()
        .into_iter()
        .map(|s| s.to_string())
        .collect();
    let mut rows = stmt.query(params![image_name]).map_err(|e| e.to_string())?;
    let Some(row) = rows.next().map_err(|e| e.to_string())? else {
        return Ok(None);
    };
    let mut obj = Map::new();
    for (i, name) in col_names.iter().enumerate() {
        if name == "image_file" {
            continue;
        }
        let raw: SqlValue = row.get(i).map_err(|e| e.to_string())?;
        let ty = attr_types.get(name).copied().unwrap_or(AttrType::Single);
        let v = sql_to_value(raw, ty);
        if !v.is_null() {
            obj.insert(name.clone(), v);
        }
    }
    Ok(Some(Value::Object(obj)))
}

#[derive(Serialize)]
pub struct DeleteFailure {
    image_name: String,
    reason: String,
}

#[derive(Serialize)]
pub struct DeleteReport {
    moved: Vec<String>,
    failed: Vec<DeleteFailure>,
}

#[tauri::command]
pub fn delete_images(
    path: String,
    image_names: Vec<String>,
) -> Result<DeleteReport, String> {
    let images_root = images_dir(&path);
    let trash_root = trash_dir(&path);

    let mut conn = open_db(&path)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let mut moved: Vec<String> = Vec::new();
    let mut failed: Vec<DeleteFailure> = Vec::new();

    for name in image_names {
        let src = images_root.join(&name);
        let dst = trash_root.join(&name);
        if let Some(parent) = dst.parent() {
            if let Err(e) = fs::create_dir_all(parent) {
                failed.push(DeleteFailure {
                    image_name: name.clone(),
                    reason: format!("create_dir_all failed: {e}"),
                });
                continue;
            }
        }
        match fs::rename(&src, &dst) {
            Ok(()) => {
                if let Err(e) = tx.execute(
                    "DELETE FROM images WHERE image_file = ?1",
                    params![name],
                ) {
                    failed.push(DeleteFailure {
                        image_name: name.clone(),
                        reason: format!("db delete failed: {e}"),
                    });
                } else {
                    moved.push(name);
                }
            }
            Err(e) => {
                failed.push(DeleteFailure {
                    image_name: name.clone(),
                    reason: format!("rename failed: {e}"),
                });
            }
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(DeleteReport { moved, failed })
}

#[derive(Serialize)]
pub struct MoveFailure {
    image_name: String,
    reason: String,
}

#[derive(Serialize)]
pub struct MovedItem {
    from: String,
    to: String,
}

#[derive(Serialize)]
pub struct MoveReport {
    moved: Vec<MovedItem>,
    failed: Vec<MoveFailure>,
}

fn validate_subdir(s: &str) -> Result<(), String> {
    if s.is_empty() {
        return Ok(());
    }
    if s.starts_with('/') {
        return Err("destination must be a relative path".into());
    }
    if s.contains('\\') {
        return Err("destination must use forward slashes".into());
    }
    for part in s.split('/') {
        if part.is_empty() || part == "." || part == ".." {
            return Err("destination contains an invalid segment".into());
        }
    }
    Ok(())
}

#[tauri::command]
pub fn move_images(
    path: String,
    image_names: Vec<String>,
    dest_subdir: String,
) -> Result<MoveReport, String> {
    let dest = dest_subdir.trim().trim_matches('/').to_string();
    validate_subdir(&dest)?;
    let images_root = images_dir(&path);

    let mut conn = open_db(&path)?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let mut moved: Vec<MovedItem> = Vec::new();
    let mut failed: Vec<MoveFailure> = Vec::new();

    for from in image_names {
        let basename = match Path::new(&from).file_name().and_then(|s| s.to_str()) {
            Some(b) => b.to_string(),
            None => {
                failed.push(MoveFailure {
                    image_name: from.clone(),
                    reason: "invalid source filename".into(),
                });
                continue;
            }
        };
        let to = if dest.is_empty() {
            basename.clone()
        } else {
            format!("{dest}/{basename}")
        };

        if to == from {
            moved.push(MovedItem { from: from.clone(), to });
            continue;
        }

        let src_path = images_root.join(&from);
        let dst_path = images_root.join(&to);

        if dst_path.exists() {
            failed.push(MoveFailure {
                image_name: from.clone(),
                reason: "destination exists".into(),
            });
            continue;
        }
        if let Some(parent) = dst_path.parent() {
            if let Err(e) = fs::create_dir_all(parent) {
                failed.push(MoveFailure {
                    image_name: from.clone(),
                    reason: format!("create_dir_all failed: {e}"),
                });
                continue;
            }
        }
        if let Err(e) = fs::rename(&src_path, &dst_path) {
            failed.push(MoveFailure {
                image_name: from.clone(),
                reason: format!("rename failed: {e}"),
            });
            continue;
        }
        if let Err(e) = tx.execute(
            "UPDATE images SET image_file = ?1 WHERE image_file = ?2",
            params![to, from],
        ) {
            // Try to roll back the FS rename so we don't desync.
            let _ = fs::rename(&dst_path, &src_path);
            failed.push(MoveFailure {
                image_name: from.clone(),
                reason: format!("db update failed: {e}"),
            });
            continue;
        }
        moved.push(MovedItem { from, to });
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(MoveReport { moved, failed })
}

fn collect_subdirs(
    root: &Path,
    dir: &Path,
    out: &mut HashSet<String>,
) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let p = entry.path();
        if !p.is_dir() {
            continue;
        }
        if let Some(name) = p.file_name().and_then(|s| s.to_str()) {
            if name.starts_with('.') {
                continue;
            }
        }
        let rel = p.strip_prefix(root).map_err(|e| e.to_string())?;
        let rel_str = rel
            .components()
            .map(|c| c.as_os_str().to_string_lossy())
            .collect::<Vec<_>>()
            .join("/");
        out.insert(rel_str);
        collect_subdirs(root, &p, out)?;
    }
    Ok(())
}

#[tauri::command]
pub fn list_image_subdirs(path: String) -> Result<Vec<String>, String> {
    let images_root = images_dir(&path);
    if !images_root.is_dir() {
        return Ok(Vec::new());
    }
    let mut set: HashSet<String> = HashSet::new();
    collect_subdirs(&images_root, &images_root, &mut set)?;
    let mut out: Vec<String> = set.into_iter().collect();
    out.sort();
    Ok(out)
}

#[tauri::command]
pub fn write_label(
    path: String,
    image_name: String,
    data: Value,
) -> Result<(), String> {
    let conn = open_db(&path)?;
    let config_path = Path::new(&path).join("config.json");
    let attr_types = match fs::read_to_string(&config_path)
        .ok()
        .and_then(|t| serde_json::from_str::<Value>(&t).ok())
    {
        Some(cfg) => parse_attr_types(&cfg),
        None => HashMap::new(),
    };
    sync_schema(&conn, &attr_types)?;

    let obj = data.as_object().ok_or("data must be an object")?;

    // Only include keys we know about in the schema (ignore extras silently).
    let mut cols: Vec<String> = vec!["image_file".to_string()];
    let mut vals: Vec<SqlValue> = vec![SqlValue::Text(image_name.clone())];
    for (k, v) in obj {
        let Some(ty) = attr_types.get(k) else {
            continue;
        };
        cols.push(k.clone());
        vals.push(value_to_sql(v, *ty));
    }

    // If only image_file is set, still upsert so the row exists.
    let placeholders: Vec<String> = (1..=cols.len()).map(|i| format!("?{i}")).collect();
    let col_list = cols.join(", ");
    let placeholder_list = placeholders.join(", ");

    let update_clause: String = cols
        .iter()
        .filter(|c| c.as_str() != "image_file")
        .map(|c| format!("{c} = excluded.{c}"))
        .collect::<Vec<_>>()
        .join(", ");

    let sql = if update_clause.is_empty() {
        format!(
            "INSERT INTO images ({col_list}) VALUES ({placeholder_list}) \
             ON CONFLICT(image_file) DO NOTHING"
        )
    } else {
        format!(
            "INSERT INTO images ({col_list}) VALUES ({placeholder_list}) \
             ON CONFLICT(image_file) DO UPDATE SET {update_clause}"
        )
    };

    conn.execute(&sql, params_from_iter(vals.iter()))
        .map_err(|e| e.to_string())?;
    Ok(())
}
