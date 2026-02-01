use std::path::{Path, PathBuf};
use crate::models::{Label, EnrichedListener, LabelKeyType};
use crate::repository::SqliteLabelRepository;
use crate::scanner::scan_listeners;
use crate::resolver::resolve_enrichment;
use crate::allocator::find_free_ports;
use anyhow::Result;

pub struct Portman {
    repo: SqliteLabelRepository,
}

impl Portman {
    pub fn new() -> Result<Self> {
        let path = Self::default_db_path()?;
        let repo = SqliteLabelRepository::new(&path)?;
        Ok(Self { repo })
    }
    
    pub fn new_with_path(path: &Path) -> Result<Self> {
        let repo = SqliteLabelRepository::new(path)?;
        Ok(Self { repo })
    }

    pub fn default_db_path() -> Result<PathBuf> {
        let data_dir = dirs::data_local_dir().ok_or_else(|| anyhow::anyhow!("Could not find data directory"))?;
        Ok(data_dir.join("portman").join("labels.sqlite"))
    }

    pub fn scan(&self) -> Result<Vec<EnrichedListener>> {
        let listeners = scan_listeners()?;
        let labels = self.repo.get_all()?;
        Ok(resolve_enrichment(listeners, labels))
    }
    
    pub fn find_free_ports(&self, start: u16, end: u16, count: usize) -> Result<Vec<u16>> {
        let listeners = scan_listeners()?;
        Ok(find_free_ports(start, end, count, &listeners))
    }

    pub fn get_labels(&self) -> Result<Vec<Label>> {
        self.repo.get_all()
    }

    pub fn set_label(&self, label: &Label) -> Result<()> {
        self.repo.upsert(label)
    }

    pub fn remove_label(&self, key_type: LabelKeyType, key_value: &str) -> Result<()> {
        self.repo.delete(key_type, key_value)
    }
}
