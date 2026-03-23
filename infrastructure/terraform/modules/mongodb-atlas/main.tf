terraform {
  required_version = ">= 1.6.0"
  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "~> 1.16"
    }
  }
}

provider "mongodbatlas" {
  public_key  = var.atlas_public_key
  private_key = var.atlas_private_key
}

# ── Atlas Project ─────────────────────────────────────────────────────────────
resource "mongodbatlas_project" "emartapp" {
  name   = var.project_name
  org_id = var.atlas_org_id
}

# ── Free-tier cluster (M0) ────────────────────────────────────────────────────
resource "mongodbatlas_cluster" "emartapp" {
  project_id = mongodbatlas_project.emartapp.id
  name       = "${var.project_name}-${var.environment}"

  # M0 is the free shared cluster tier
  provider_name               = "TENANT"
  backing_provider_name       = var.cloud_provider
  provider_region_name        = var.region
  provider_instance_size_name = "M0"  # free tier; upgrade to M10+ for production

  auto_scaling_disk_gb_enabled = false  # not available on M0
}

# ── Database user ─────────────────────────────────────────────────────────────
resource "mongodbatlas_database_user" "emartapp" {
  username           = var.db_username
  password           = var.db_password
  project_id         = mongodbatlas_project.emartapp.id
  auth_database_name = "admin"

  roles {
    role_name     = "readWrite"
    database_name = var.database_name
  }

  scopes {
    name = mongodbatlas_cluster.emartapp.name
    type = "CLUSTER"
  }
}

# ── IP Access list ────────────────────────────────────────────────────────────
resource "mongodbatlas_project_ip_access_list" "emartapp" {
  for_each   = toset(var.allowed_cidrs)
  project_id = mongodbatlas_project.emartapp.id
  cidr_block = each.value
  comment    = "Managed by Terraform – emartapp ${var.environment}"
}
