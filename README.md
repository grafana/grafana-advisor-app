# grafana-advisor-app

An app for visualising checks that require immediate action or investigation.

## Development
Follow these steps once you have pulled the repo:

#### 1. Install dependencies
```bash
npm install
```

#### 2. Build the UI
```bash
npm run build

# Alternatively watch for changes in a separate bash session
# npm run dev
```

#### 3. Run with docker (Grafana `main`)
```bash
npm run server
```

#### 4. Visit in the browser
[http://localhost:3000/admin/advisor](http://localhost:3000/admin/advisor)


#### 5. Run checks
Click on the "Run checks" button in case you don't see anything, and refresh the page after a few seconds.

(Clicking the button initiates the checks, but it "doesn't wait" for them to finish, that can take some time.)


### How to run the plugin with the `grafana/grafana` repo?
This is gonna be interesting, as running Grafana from the repo gives us much more issues! 