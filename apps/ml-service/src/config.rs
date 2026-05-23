use std::path::{Path, PathBuf};

pub const LABELS: [&str; 4] = ["Bercak Daun", "Daun Sehat", "Karat Daun", "Hawar Daun"];
pub const SERVICE_NAME: &str = "zeavis-ml-service";
pub const SERVICE_VERSION: &str = env!("CARGO_PKG_VERSION");
pub const DEFAULT_INPUT_SIZE: u32 = 224;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Config {
    pub host: String,
    pub port: u16,
    pub model_path: PathBuf,
    pub input_size: u32,
}

pub fn resolve_model_path(base_dir: &Path, model_path: &str) -> PathBuf {
    let path = PathBuf::from(model_path);
    if path.is_absolute() {
        path
    } else {
        base_dir.join(path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn labels_match_training_class_order_with_display_names() {
        assert_eq!(LABELS, ["Bercak Daun", "Daun Sehat", "Karat Daun", "Hawar Daun"]);
    }

    #[test]
    fn relative_model_path_resolves_from_service_directory() {
        let base = Path::new("/repo/apps/ml-service");
        let resolved = resolve_model_path(base, "../../Machine_Learning/model/model.onnx");
        assert_eq!(resolved, PathBuf::from("/repo/apps/ml-service/../../Machine_Learning/model/model.onnx"));
    }

    #[test]
    fn absolute_model_path_is_preserved() {
        let base = Path::new("/repo/apps/ml-service");
        let resolved = resolve_model_path(base, "/models/model.onnx");
        assert_eq!(resolved, PathBuf::from("/models/model.onnx"));
    }
}
