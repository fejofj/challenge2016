const Openapi = require("moleculer-auto-openapi");

module.exports = {
	name: 'openapi',
	mixins: [Openapi],
	settings: {
		// all setting optional
		openapi: {
			info: {
				// about project
				description: "Challenge2016 solution by Febin K Joseph febinjoseph63@gmail.com",
				title: "Challenge2016",
			},
			tags: [
				// you tags
				{ name: "auth", description: "Febin K Joseph, febinjoseph63@gmail.com" },
			],
			components: {
				// you auth
				securitySchemes: {
					myBasicAuth: {
						type: 'http',
						scheme: 'basic',
					},
				},
			},
		},
	},
}
