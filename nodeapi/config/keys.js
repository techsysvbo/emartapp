// All sensitive values are loaded from environment variables.
// See .env.example at the repository root for required variables.
// For local development use scripts/vault-sync.sh to populate .env from Vault,
// or copy .env.example to .env and fill in the values manually.
module.exports = {
  mongoURI: process.env.MONGO_URI || "mongodb://emongo:27017/epoc",
  secretOrKey: process.env.JWT_SECRET,
};
