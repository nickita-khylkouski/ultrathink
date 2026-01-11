# 🧬 AI Drug Discovery Platform - Frontend

Modern React/Next.js frontend for the AI Drug Discovery Platform, migrated from vanilla JavaScript to a production-ready TypeScript application.

## 🚀 Features

### Core Functionality
- **Drug Discovery Workflow**: Generate drug candidates for any disease target
- **ESMFold Protein Structure Prediction**: Predict 3D protein structures from amino acid sequences
- **MolGAN Molecular Evolution**: Evolve molecules using generative AI
- **3D Molecular Visualization**: Interactive 3D viewer using 3Dmol.js
- **ADMET Analysis**: Comprehensive drug property calculations
- **Export Capabilities**: PDB, SMILES, CSV, JSON formats

### Technical Features
- ✅ Next.js 14 with App Router
- ✅ TypeScript for type safety
- ✅ Zustand state management
- ✅ React Hook Form + Zod validation
- ✅ Tailwind CSS styling
- ✅ 3Dmol.js integration
- ✅ Keyboard shortcuts
- ✅ Error handling and retry logic
- ✅ LocalStorage persistence
- ✅ Responsive design

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Backend API running at `localhost:7001` (see `../orchestrator/`)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
frontend/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── shared/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── ProgressBar.tsx
│   ├── MoleculeViewer/      # 3D molecule viewer
│   │   └── MoleculeViewer.tsx
│   ├── ProteinViewer/       # 3D protein viewer
│   │   └── ProteinViewer.tsx
│   ├── DiscoveryForm/       # Discovery workflow form
│   │   └── DiscoveryForm.tsx
│   ├── CandidatesList/      # Results table
│   │   └── CandidatesList.tsx
│   └── PropertiesPanel/     # ADMET properties display
│       └── PropertiesPanel.tsx
├── services/
│   └── api.ts               # API client
├── store/                   # Zustand stores
│   ├── useAppStore.ts       # App-level state
│   ├── useDiscoveryStore.ts # Discovery state
│   ├── useProteinStore.ts   # Protein prediction state
│   └── useMolGANStore.ts    # MolGAN evolution state
├── utils/
│   ├── validators.ts        # Input validation
│   ├── formatters.ts        # Data formatting
│   ├── exporters.ts         # File export utilities
│   └── keyboard.ts          # Keyboard shortcuts
├── types/
│   ├── api.ts              # API response types
│   ├── molecule.ts         # Molecule types
│   └── protein.ts          # Protein types
└── styles/
    └── globals.css         # Global styles
```

## 🎯 Usage Guide

### Drug Discovery Workflow

1. **Enter Disease Target:**
   - Type any disease name (e.g., "Cancer", "Alzheimer's", "Malaria")
   - Or click a common drug button

2. **Set Parameters:**
   - Number of molecules: 1-20 candidates
   - Click "DISCOVER" or press `Enter`

3. **View Results:**
   - Candidates appear ranked by ADMET score
   - Click a candidate to view detailed properties

4. **3D Visualization:**
   - Selected molecule appears in 3D viewer
   - Drag to rotate, scroll to zoom, shift+drag to pan

5. **Export Data:**
   - Copy SMILES string
   - Export single molecule
   - Export all candidates as CSV

### ESMFold Protein Prediction

1. **Enter Protein Sequence:**
   - Paste amino acid sequence (ACDEFGHIKLMNPQRSTVWY)
   - Or select from common proteins

2. **Predict Structure:**
   - Click "PREDICT" button
   - Wait for ESMFold processing

3. **View 3D Structure:**
   - Interactive protein structure in cartoon representation
   - Download PDB file

### Keyboard Shortcuts

- `Enter` - Run discovery
- `Ctrl+D` - Download PDB/SMILES
- `Ctrl+K` - Clear results
- `Escape` - Close modals

## 🔧 API Integration

The frontend connects to the backend API at `localhost:7001`:

### Main Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/orchestrate/demo` | POST | Drug discovery |
| `/research/esmfold/predict` | POST | Protein structure prediction |
| `/research/molgan/generate` | POST | Molecular evolution |

### Request Example

```typescript
import { api } from '@/services/api';

// Run drug discovery
const response = await api.runDiscovery({
  target_name: 'Cancer',
  num_molecules: 5,
  target_qed: 0.8,
  target_logp: 2.5,
  target_sas: 3.0,
});

console.log(response.top_candidates);
```

## 🎨 Styling & Theming

### Color Palette

```css
--primary: #00ff00;     /* Bright green */
--secondary: #00ff88;   /* Cyan-green */
--accent: #00ffff;      /* Cyan */
--warning: #ffff00;     /* Yellow */
--danger: #ff0000;      /* Red */
--background: #0a0a0a;  /* Dark background */
--panel: #1a1a1a;       /* Panel background */
```

### Customization

Modify `tailwind.config.ts` to customize:
- Colors
- Fonts
- Spacing
- Breakpoints

## 🧪 Testing

### Manual Testing Checklist

- [ ] Health check shows "Online" status
- [ ] Discovery generates candidates
- [ ] 3D viewer renders molecules
- [ ] Form validation prevents invalid inputs
- [ ] Error messages display correctly
- [ ] Export functions work (CSV, SMILES)
- [ ] Keyboard shortcuts functional
- [ ] LocalStorage persistence works

### Test Discovery

```bash
# Ensure backend is running
cd ../orchestrator
python main.py

# In another terminal, test frontend
npm run dev
```

## 📊 Performance

### Optimizations

- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js Image component
- **API Retry Logic**: Automatic retry on network failures
- **LocalStorage Caching**: Persist candidates between sessions
- **Lazy Loading**: 3Dmol.js loaded on demand

### Build for Production

```bash
npm run build
npm run start
```

## 🐛 Troubleshooting

### Common Issues

**"System Offline" Status:**
- Ensure backend is running at `localhost:7001`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS settings in backend

**3D Viewer Not Loading:**
- Check browser console for 3Dmol.js errors
- Ensure internet connection (CDN dependency)
- Try refreshing the page

**Type Errors:**
- Run `npm run lint` to check for TypeScript errors
- Ensure all dependencies are installed: `npm install`

**Validation Errors:**
- Protein sequences: Only ACDEFGHIKLMNPQRSTVWY
- SMILES strings: Check for balanced parentheses
- Target names: 2-100 characters

## 🔐 Security Notes

### Input Validation

All user inputs are validated both client-side (Zod schemas) and server-side:

- **Protein Sequences**: Amino acid validation, length limits
- **SMILES Strings**: Basic syntax validation
- **Target Names**: XSS prevention, length limits

### API Communication

- **Timeout Protection**: 60-second timeout on all requests
- **Error Handling**: Graceful degradation on API failures
- **CORS**: Configured for `localhost` development

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL=https://your-api-domain.com`
4. Deploy

### Docker

```bash
# Build Docker image
docker build -t drug-discovery-frontend .

# Run container
docker run -p 3000:3000 drug-discovery-frontend
```

### Static Export

```bash
# Generate static HTML
npm run build

# Deploy /out directory to any static host
```

## 📚 Additional Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Zustand Guide](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com/)
- [3Dmol.js](https://3dmol.csb.pitt.edu/)

### Related Projects
- Backend API: `../orchestrator/`
- Original Frontend: `../web/`
- Smart-Chem: `../Smart-Chem/`

## 👥 Contributing

This is a hackathon project. For questions or contributions:

1. Review the codebase structure
2. Ensure TypeScript types are maintained
3. Follow existing code patterns
4. Test all changes locally

## 📝 License

ISC License - See parent project for details

---

**Built with ❤️ using Next.js 14, TypeScript, and 3Dmol.js**

🧬 Accelerating drug discovery through AI
