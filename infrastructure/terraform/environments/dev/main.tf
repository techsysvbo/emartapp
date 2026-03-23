terraform {
  required_version = ">= 1.6.0"

  # Remote state – use an S3-compatible backend or Terraform Cloud in production.
  # For local dev, state is stored locally (default).
  # backend "s3" {
  #   bucket = "emartapp-tfstate"
  #   key    = "dev/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

module "mongodb_atlas" {
  source = "../../modules/mongodb-atlas"

  atlas_public_key  = var.atlas_public_key
  atlas_private_key = var.atlas_private_key
  atlas_org_id      = var.atlas_org_id
  environment       = "dev"
  db_password       = var.db_password
  allowed_cidrs     = ["0.0.0.0/0"]  # open for dev; restrict for staging/prod
}

output "mongo_uri" {
  value     = module.mongodb_atlas.mongo_uri
  sensitive = true
}
