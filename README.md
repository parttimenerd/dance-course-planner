# Dance Course Planner

Select dance courses from [nimbuscloud.at](https://community.nimbuscloud.at/#app/schedule/)
and generate a personalized schedule.

Are you tired of manually checking the dance course schedule every week and trying to fit?
Then this tool is for you!

*This is just a personal tool and not affiliated with Nimbus Cloud.*

## Features

- Loads the schedule for a specified week from the schedule.json (download it yourself)
- Has a dev server that serves the schedule.json and the single file web app
- Allows selection of dance courses by their names
- Allows to give constraints
  - No course before a certain time
  - No course after a certain time
  - Days with courses
  - Maximum time between courses
  - Not more than one course of the same name per day
  - Maximum number of courses per day
  - No courses on certain days
- Then shows all possible schedules that meet the constraints in a simple
  table and list view
- All this as a responsive single file web app with vue.js and tailwindcss
- No backend, all in the browser, usable from mobile devices
  
## Usage

1. Download the schedule.json from [nimbuscloud.at](https://community.nimbuscloud.at/#app/schedule/)
   (you need to be logged in and have access to the dance courses, use the browser dev tools to find the JSON)
   - make sure to select all courses in the filter and apply it in the UI before downloading
2. Place the schedule.json file in the root directory of the project
3. Start the development server

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
- Copy `schedule.json` from the root directory to the `dist` folder (if it exists)

**Note**: Make sure you have `schedule.json` in the root directory before building, otherwise you'll need to add it manually to the `dist` folder after deployment.

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
3. The `schedule.json` file will be automatically included in the build

**Note**: If you don't have `schedule.json` in the root directory during build, you'll need to upload it manually to the `/dance-planner/` directory.

Example file structure on server:

```text
/dance-planner/
  ├── index.html
  ├── schedule.json
  ├── assets/
  │   ├── index-*.css
  │   └── index-*.js
  └── sw.js
```

### For Root Domain Deployment

If deploying to the root domain, change the `base` setting in `vite.config.js`:

```javascript
base: '/', // instead of '/dance-planner/'
```

Then rebuild the project.

### Common Issues

- **MIME Type Errors**: Usually caused by incorrect `base` configuration in `vite.config.js`
- **404 Errors**: Make sure all files from `dist` are uploaded and the server can serve static files
- **Missing schedule.json**: The app requires `schedule.json` to be manually placed in the deployment directory
- **Service Worker Issues**: If you previously deployed to a different path, old service workers might interfere. Clear your browser's application data/storage for the domain, or wait for the app to automatically clean up old service workers on the first load.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License