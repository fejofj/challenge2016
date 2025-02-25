const fs = require('fs');
const Papa = require('papaparse');

const cities = [];

const options = { header: true };

fs.createReadStream(`${__dirname}/../cities.csv`)
	.pipe(Papa.parse(Papa.NODE_STREAM_INPUT, options))
	.on('data', (data) => {
		cities.push(data);
	})
	.on('end', () => {
		console.log(cities.length);
	});

const getCities = () => cities;

module.exports = {
	getCities,
};
