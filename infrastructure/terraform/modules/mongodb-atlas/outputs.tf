output "connection_string" {
  description = "MongoDB Atlas SRV connection string (without credentials)"
  value       = mongodbatlas_cluster.emartapp.connection_strings[0].standard_srv
  sensitive   = false
}

output "mongo_uri" {
  description = "Full MongoDB URI including credentials (sensitive)"
  value = "mongodb+srv://${var.db_username}:${var.db_password}@${replace(mongodbatlas_cluster.emartapp.connection_strings[0].standard_srv, "mongodb+srv://", "")}/${var.database_name}?retryWrites=true&w=majority"
  sensitive   = true
}

output "project_id" {
  description = "Atlas project ID"
  value       = mongodbatlas_project.emartapp.id
}
