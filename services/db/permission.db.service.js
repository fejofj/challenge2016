'use strict';

const DbMixin = require('../../mixins/db.mixin');
/**
 * permission-db service
 */
module.exports = {
	name: 'permission',
	version: 1,
	mixins: [DbMixin('permission')],
	/**
	 * Service settings
	 */
	settings: {
		idField: 'id',
		fields: [
			'id',
			'filmId',
			'distributorId',
			'rule',
			'access',
			'rightsOwner',
		],
		entityValidator: {},
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
