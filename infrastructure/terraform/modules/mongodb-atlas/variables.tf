variable "atlas_public_key" {
  description = "MongoDB Atlas API public key"
  type        = string
  sensitive   = true
}

variable "atlas_private_key" {
  description = "MongoDB Atlas API private key"
  type        = string
  sensitive   = true
}

variable "atlas_org_id" {
  description = "MongoDB Atlas organisation ID"
  type        = string
}

variable "project_name" {
  description = "Atlas project name"
  type        = string
  default     = "emartapp"
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod)"
  type        = string
}

variable "cloud_provider" {
  description = "Backing cloud provider for M0 (AWS | GCP | AZURE)"
  type        = string
  default     = "AWS"
}

variable "region" {
  description = "Cloud provider region"
  type        = string
  default     = "US_EAST_1"
}

variable "db_username" {
  description = "MongoDB database username"
  type        = string
  default     = "emartapp_user"
}

variable "db_password" {
  description = "MongoDB database password"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "Database name to grant access to"
  type        = string
  default     = "epoc"
}

variable "allowed_cidrs" {
  description = "CIDR blocks allowed to connect to Atlas (use 0.0.0.0/0 only for dev)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
