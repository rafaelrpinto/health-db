let bunyan = require("bunyan");
// project dependencies
let HealthFacilitiesParser = require('./HealthFacilitiesParser');
let log = bunyan.createLogger({name: "app-logger"});


async function parseHealthFacilities() {
  let parser = new HealthFacilitiesParser("files/cnes.csv");
  try {
    log.info('Initiating process.');
    await parser.parse();
    log.info('Process complete.');
  } catch (err) {
    log.fatal({err: err});
  } finally {
    process.exit();
  }
}

// initiates the parsing
parseHealthFacilities();
