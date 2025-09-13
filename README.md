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
The built files will be in the `dist` directory.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License
MIT License