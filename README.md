# Dance Course Planner

Are you tired of manually checking the dance course schedule every week and trying to fit?
Then this tool is for you!

*This is just a personal tool and not affiliated with Nimbus Cloud, it just adds some convenience features on top of their website.*

## Features

- **Nimbuscloud Integration**: Login directly with your Nimbuscloud credentials to access current course data
- **Course Selection**: Choose from available dance courses by their names
- **Constraint-Based Planning**
- **Schedule Generation**: Shows all possible schedules that meet your constraints
- **Multiple Views**: Simple table and list view for easy comparison
- **Responsive Design**: Single file web app with Vue.js and Tailwind CSS
- **Mobile Friendly**: No backend required, works on all devices
- **Privacy Focused**: No data is stored or transmitted to third parties and no data is stored on servers other than Nimbuscloud

## Configuration

The app uses a simple JSON configuration file for basic settings. **The app works without any configuration** using sensible defaults.

1. **Copy the sample config**: `cp src/config/app.config.sample.json src/config/app.config.json`
2. **Edit the configuration** to match your preferences:

   ```json
   {
     "courseDurationMinutes": 70,
     "locationSelector": {
       "showLocationSelector": false,
       "defaultLocation": "Karlsruhe"
     }
   }
   ```

### Configuration Options

- **`courseDurationMinutes`**: Duration of each course in minutes (default: 70 minutes = 60min class + 10min break)
- **`locationSelector.showLocationSelector`**: Whether to show the location selector dropdown (default: false)
- **`locationSelector.defaultLocation`**: Default location to select when the app loads (default: "Karlsruhe")

### Default Behavior (No Config File)

If no `app.config.json` file exists, the application uses these defaults:

- Course duration: 70 minutes
- Location selector: **hidden** (since most users have a single location)
- Default location: "Karlsruhe"
  
## Usage


```bash
npm install
npm run dev
```

## Build

To build the project for production, run:

```bash
npm run build
```

The built files will be in the `dist` directory. The build process will automatically:

- Bundle and optimize all assets with the correct base path
- Generate a production-ready single-page application

## Deployment

### For Subdirectory Deployment

If you're deploying to a subdirectory (like `/dance-planner/`), the Vite configuration is already set up with `base: '/dance-planner/'`.

**Key files have been configured for subdirectory deployment:**

- `vite.config.js`: Set with `base: '/dance-planner/'`
- `index.html`: Cleaned up asset references  
- `manifest.json`: Uses relative paths (`./`) for subdirectory compatibility
- All JavaScript imports: Use `import.meta.env.BASE_URL` for dynamic path resolution

After building:

1. Upload the contents of the `dist` folder to your server's `/dance-planner/` directory
2. Ensure your web server is configured to serve static files from this directory

### For Root Domain Deployment

If deploying to the root domain, change the `base` setting in `vite.config.js`:

```javascript
base: '/', // instead of '/dance-planner/'
```

Then rebuild the project.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License
