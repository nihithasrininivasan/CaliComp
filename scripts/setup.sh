#!/usr/bin/env bash
# =============================================================================
# CaliComp — Local Development Setup Script
# =============================================================================
# Usage:
#   chmod +x scripts/setup.sh
#   ./scripts/setup.sh
# =============================================================================

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log()   { echo -e "${CYAN}[CaliComp]${NC} $1"; }
ok()    { echo -e "${GREEN}  ✓${NC} $1"; }
warn()  { echo -e "${YELLOW}  ⚠${NC} $1"; }
fail()  { echo -e "${RED}  ✗${NC} $1"; exit 1; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────

log "Running pre-flight checks..."

command -v python3 >/dev/null 2>&1 || fail "Python 3 is required but not found."
ok "Python 3 found: $(python3 --version)"

command -v pip >/dev/null 2>&1 || command -v pip3 >/dev/null 2>&1 || fail "pip is required."
ok "pip found"

command -v node >/dev/null 2>&1 || fail "Node.js is required but not found."
ok "Node.js found: $(node --version)"

command -v npm >/dev/null 2>&1 || fail "npm is required but not found."
ok "npm found: $(npm --version)"

# ── Environment file ──────────────────────────────────────────────────────────

log "Setting up environment..."

if [ ! -f .env ]; then
    cp .env.example .env
    ok "Created .env from .env.example"
else
    ok ".env already exists"
fi

# ── Install SDK ───────────────────────────────────────────────────────────────

log "Installing CaliComp SDK..."

cd sdk
pip install -e . --quiet
cd ..
ok "SDK installed (editable mode)"

# ── Install Backend Dependencies ──────────────────────────────────────────────

log "Installing backend dependencies..."

cd backend
pip install -r requirements.txt --quiet
cd ..
ok "Backend dependencies installed"

# ── Install Frontend Dependencies ─────────────────────────────────────────────

log "Installing frontend dependencies..."

cd frontend
npm install --silent
cd ..
ok "Frontend dependencies installed"

# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "  Setup complete! 🎉"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log "To start the backend:"
log "  cd backend && uvicorn app.main:app --reload --port 8000"
echo ""
log "To start the frontend:"
log "  cd frontend && npm start"
echo ""
log "Or use Docker Compose:"
log "  docker-compose up --build"
echo ""
