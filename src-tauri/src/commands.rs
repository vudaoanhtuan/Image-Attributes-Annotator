use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

const IMAGE_EXTS: &[&str] = &["jpg", "jpeg", "png", "webp", "bmp"];

#[derive(Serialize)]
pub struct OpenedDataset {
    images: Vec<String>,
    labeled: Vec<String>,
    config: Option<serde_json::Value>,
}

fn images_dir(dataset: &str) -> PathBuf {
    Path::new(dataset).join("images")
}

fn labels_dir(dataset: &str) -> PathBuf {
    Path::new(dataset).join("labels")
}

fn label_path(dataset: &str, image_name: &str) -> PathBuf {
    let stem = Path::new(image_name)
        .file_stem()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_else(|| image_name.to_string());
    labels_dir(dataset).join(format!("{stem}.json"))
}

#[tauri::command]
pub fn open_dataset(path: String) -> Result<OpenedDataset, String> {
    let images_path = images_dir(&path);
    if !images_path.is_dir() {
        return Err(format!(
            "'images' subfolder not found under: {}",
            path
        ));
    }
    let labels_path = labels_dir(&path);
    if !labels_path.exists() {
        fs::create_dir_all(&labels_path).map_err(|e| e.to_string())?;
    }

    let mut images: Vec<String> = fs::read_dir(&images_path)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| entry.ok())
        .filter(|e| e.path().is_file())
        .filter_map(|e| {
            let p = e.path();
            let ext = p
                .extension()
                .and_then(|s| s.to_str())
                .map(|s| s.to_lowercase());
            match ext {
                Some(ref ex) if IMAGE_EXTS.contains(&ex.as_str()) => {
                    e.file_name().to_str().map(|s| s.to_string())
                }
                _ => None,
            }
        })
        .collect();
    images.sort();

    let labeled = collect_labeled(&labels_path);

    let config_path = Path::new(&path).join("config.json");
    let config = match fs::read_to_string(&config_path) {
        Ok(text) => match serde_json::from_str::<serde_json::Value>(&text) {
            Ok(v) => Some(v),
            Err(e) => {
                eprintln!("config.json parse error: {e}");
                None
            }
        },
        Err(_) => None,
    };

    Ok(OpenedDataset { images, labeled, config })
}

fn collect_labeled(labels_path: &Path) -> Vec<String> {
    let mut out = Vec::new();
    if let Ok(entries) = fs::read_dir(labels_path) {
        for e in entries.flatten() {
            let p = e.path();
            if p.is_file() && p.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Some(stem) = p.file_stem().and_then(|s| s.to_str()) {
                    out.push(stem.to_string());
                }
            }
        }
    }
    out
}

#[tauri::command]
pub fn list_labeled(path: String) -> Result<Vec<String>, String> {
    Ok(collect_labeled(&labels_dir(&path)))
}

#[tauri::command]
pub fn read_label(
    path: String,
    image_name: String,
) -> Result<Option<serde_json::Value>, String> {
    let lp = label_path(&path, &image_name);
    if !lp.exists() {
        return Ok(None);
    }
    let text = fs::read_to_string(&lp).map_err(|e| e.to_string())?;
    let json: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| e.to_string())?;
    Ok(Some(json))
}

#[tauri::command]
pub fn write_label(
    path: String,
    image_name: String,
    data: serde_json::Value,
) -> Result<(), String> {
    let lp = label_path(&path, &image_name);
    let parent = lp.parent().ok_or("invalid label path")?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let tmp = lp.with_extension("json.tmp");
    let pretty = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
    fs::write(&tmp, pretty).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &lp).map_err(|e| e.to_string())?;
    Ok(())
}
