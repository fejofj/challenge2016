'use strict';

const DbMixin = require('../../mixins/db.mixin');
/**
 * film-db-permission-db-right-db service
 */
module.exports = {
	name: 'film',
	version: 1,
	mixins: [DbMixin('film')],
	/**
	 * Service settings
	 */
	settings: {
		idField: 'id',
		fields: ['id', 'filmName'],
		entityValidator: {
			filmName: 'string',
		},
	},

	/**
	 * Service metadata
	 */
	metadata: {},

	/**
	 * Service dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Test action
		 */
		test: {
			async handler(ctx) {
				return 'Hello Moleculer';
			},
		},
	},

	/**
	 * Events
	 */
	events: {
		async 'some.thing'(ctx) {
			this.logger.info('Something happened', ctx.params);
		},
	},

	/**
	 * Methods
	 */
	methods: {},

	/**
	 * Service created lifecycle event handler
	 */
	created() {},

	/**
	 * Service started lifecycle event handler
	 */
	async started() {},

	/**
	 * Service stopped lifecycle event handler
	 */
	async stopped() {},
};
