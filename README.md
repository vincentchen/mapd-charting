mapdc.js
=====

Dimensional charting built to work natively with crossfilter rendered using d3.js.

### Installation:

Clone down the repo and run the following commands:

```bash
git clone https://github.com/map-d/mapdc.js.git
cd mapdc.js/
npm install
bash scripts/install.sh
```

## Running the example:

```bash
cd example/
npm install # install the example's dependencies
cd ../
npm start # start the example server from the top level directory
```

When the browser opens, click the **example** directory to view the examples.

## Grunt Tasks:

Local Command | Description
--- | ---
`node_modules/grunt-cli/bin/grunt` | Builds the library
`node_modules/grunt-cli/bin/grunt watch` | Automatically rebuilds mapdc after each file save

You can install grunt globally on your machine by running `npm install -g grunt-cli`, otherwise use the local commands.

Global Command | Description
--- | ---
`grunt` | Builds the library
`grunt watch` | Automatically rebuilds mapdc after each file save

## Pull Requests:

Attach the appropriate semver label below to the **title of your pull request**. This allows Jenkins to publish to npm automatically.

Semvar Tag | Description
--- | ---
`[major]` | Breaking changes, api changes, moving files
`[minor]` | New features (additive only!)
`[patch]` | Bugfixes, documentation

Jenkins will not let you merge a pull request that contains a missing or multiple semver label.

**Forgot to add a semver label?**

1. Update the PR Title
2. Close the PR
3. Re-open it to force Jenkins to retest the new title.
