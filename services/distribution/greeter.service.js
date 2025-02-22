'use strict';

const _ = require('lodash');

const { getCities } = require('../../utlis/cities');
/**
 * @typedef {import('moleculer').ServiceSchema} ServiceSchema Moleculer's Service Schema
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

/** @type {ServiceSchema} */
module.exports = {
	name: 'greeter',

	/**
	 * Settings
	 */
	settings: {},

	/**
	 * Dependencies
	 */
	dependencies: [],

	/**
	 * Actions
	 */
	actions: {
		/**
		 * Say a 'Hello' action.
		 *
		 * @returns
		 */
		hello: {
			rest: {
				method: 'GET',
				path: '/hello',
			},
			async handler() {
				return 'Hello Moleculer';
			},
		},
		cities: {
			rest: {
				method: 'GET',
				path: '/cities/:name',
			},
			params: {
				name: 'string',
			},
			async handler(ctx) {
				const { name } = ctx.params;
				const _cities = getCities();
				const _index = _.findIndex(
					_cities,
					(city) => city['Province Name'] === name,
				);
				if (_index === -1) throw new Error('No cities found.');
				return {
					length: _cities.length,
					cities: _.slice(_cities, 0, 2),
					status: _index,
				};
			},
		},

		/**
		 * Welcome, a username
		 *
		 * @param {String} name - User name
		 */
		welcome: {
			rest: '/welcome',
			params: {
				name: 'string',
			},
			/** @param {Context} ctx  */
			async handler(ctx) {
				return `Welcome, ${ctx.params.name}`;
			},
		},
	},

	/**
	 * Events
	 */
	events: {},

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
