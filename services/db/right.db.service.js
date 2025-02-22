'use strict';

const DbMixin = require('../../mixins/db.mixin');
/**
 * right-db service
 */
module.exports = {
	name: 'rights',
	version: 1,
	mixins: [DbMixin('rights')],
	/**
	 * Service settings
	 */
	settings: {
		idField: 'id',
		fields: ['id', 'permId', 'ownerId'],
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
