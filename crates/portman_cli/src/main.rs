use clap::{Parser, Subcommand, Args};
use portman_core::{Portman, models::{Label, LabelKeyType}};
use comfy_table::Table;
use anyhow::Result;

#[derive(Parser)]
#[command(name = "portman")]
#[command(about = "Port manager for local development", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Scan for active listeners
    Scan {
        /// Output as JSON
        #[arg(long)]
        json: bool,
    },
    /// Show details for a specific port
    Who {
        port: u16,
    },
    /// Port management commands
    Ports {
        #[command(subcommand)]
        cmd: PortsCommands,
    },
    /// Label management commands
    Label {
        #[command(subcommand)]
        cmd: LabelCommands,
    },
}

#[derive(Subcommand)]
enum PortsCommands {
    /// Find available ports
    Find {
        /// Start of range
        #[arg(long, default_value_t = 3000)]
        range_start: u16,
        /// End of range
        #[arg(long, default_value_t = 8000)]
        range_end: u16,
        /// Number of ports to find
        #[arg(long, default_value_t = 10)]
        count: usize,
    }
}

#[derive(Subcommand)]
enum LabelCommands {
    /// Set a label
    Set(SetLabelArgs),
    /// List all labels
    List,
    /// Remove a label
    Remove(RemoveLabelArgs),
}

#[derive(Args)]
struct SetLabelArgs {
    #[arg(long)]
    port: Option<u16>,
    #[arg(long)]
    pid: Option<i32>,
    #[arg(long)]
    pattern: Option<String>,
    
    #[arg(long)]
    name: String,
    
    #[arg(long)]
    note: Option<String>,
}

#[derive(Args)]
struct RemoveLabelArgs {
    #[arg(long)]
    port: Option<u16>,
    #[arg(long)]
    pid: Option<i32>,
    #[arg(long)]
    pattern: Option<String>,
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    let app = Portman::new()?;

    match cli.command {
        Commands::Scan { json } => {
            let listeners = app.scan()?;
            if json {
                println!("{}", serde_json::to_string_pretty(&listeners)?);
            } else {
                let mut table = Table::new();
                table.set_header(vec!["Port", "PID", "Process", "Inferred", "Label", "Note", "URL"]);

                for item in listeners {
                    let l = item.listener;
                    let label = item.label;

                    let label_name = label.as_ref().map(|l| l.name.as_str()).unwrap_or("");
                    let label_note = label.as_ref().and_then(|l| l.note.as_deref()).unwrap_or("");

                    table.add_row(vec![
                        l.port.to_string(),
                        l.pid.map(|p| p.to_string()).unwrap_or("-".into()),
                        l.process.unwrap_or("-".into()),
                        l.inferred_type.unwrap_or("-".into()),
                        label_name.to_string(),
                        label_note.to_string(),
                        l.url,
                    ]);
                }
                println!("{table}");
            }
        },
        Commands::Who { port } => {
            let listeners = app.scan()?;
            if let Some(target) = listeners.into_iter().find(|l| l.listener.port == port) {
                println!("{}", serde_json::to_string_pretty(&target)?);
            } else {
                println!("No listener found on port {}", port);
            }
        },
        Commands::Ports { cmd } => {
            match cmd {
                PortsCommands::Find { range_start, range_end, count } => {
                    let ports = app.find_free_ports(range_start, range_end, count)?;
                    for p in ports {
                        println!("{}", p);
                    }
                }
            }
        },
        Commands::Label { cmd } => {
            match cmd {
                LabelCommands::List => {
                    let labels = app.get_labels()?;
                    let mut table = Table::new();
                    table.set_header(vec!["Type", "Value", "Name", "Note"]);
                    for l in labels {
                        table.add_row(vec![
                            l.key_type.to_string(),
                            l.key_value,
                            l.name,
                            l.note.unwrap_or_default()
                        ]);
                    }
                    println!("{table}");
                },
                LabelCommands::Set(args) => {
                    let (key_type, key_value) = if let Some(p) = args.port {
                        (LabelKeyType::Port, p.to_string())
                    } else if let Some(p) = args.pid {
                        (LabelKeyType::Pid, p.to_string())
                    } else if let Some(p) = args.pattern {
                        (LabelKeyType::Pattern, p)
                    } else {
                        anyhow::bail!("Must specify one of --port, --pid, or --pattern");
                    };

                    let label = Label {
                        id: None,
                        key_type,
                        key_value,
                        name: args.name,
                        note: args.note,
                        created_at: chrono::Utc::now(),
                        updated_at: chrono::Utc::now(),
                    };
                    app.set_label(&label)?;
                    println!("Label set successfully");
                },
                LabelCommands::Remove(args) => {
                     let (key_type, key_value) = if let Some(p) = args.port {
                        (LabelKeyType::Port, p.to_string())
                    } else if let Some(p) = args.pid {
                        (LabelKeyType::Pid, p.to_string())
                    } else if let Some(p) = args.pattern {
                        (LabelKeyType::Pattern, p)
                    } else {
                        anyhow::bail!("Must specify one of --port, --pid, or --pattern");
                    };
                    app.remove_label(key_type, &key_value)?;
                    println!("Label removed");
                }
            }
        }
    }

    Ok(())
}
