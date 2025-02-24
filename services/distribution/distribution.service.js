'use strict';

const _ = require('lodash');
const jsonMerger = require('json-merger');

const { getCities } = require('../../utlis/cities');
const DbMixin = require('../../mixins/db.mixin');
const QUBE = 'zr8Yf8Rf9PkT56LY'; // id of QUBE
/**
 * distribution service
 */
module.exports = {
	name: 'distribution',
	version: 1,
	mixins: [DbMixin('distribution')],
	settings: {
		idField: 'id',
		fields: ['id', 'distributorName'],
		entityValidator: {
			distributorName: 'string',
			mapping: { type: 'boolean', convert: true },
		},
	},
	metadata: {},
	dependencies: [],
	actions: {
		getDistributionList: {
			rest: {
				method: 'POST',
				path: '/get-distribution-list',
			},
			cache: false,
			async handler(ctx) {
				try {
					return await ctx.call('distribution.db.list', {});
				} catch (err) {
					console.error(err);

					throw Error(err.message);
				}
			},
		},
		addDistribution: {
			rest: {
				method: 'POST',
				path: '/add-distribution',
			},
			params: {
				$$strict: true,
				filmName: 'string',
				distributorName: 'string',
				rightsOwner: 'string',
				include: {
					type: 'array',
					optional: true,
					items: {
						type: 'object',
						props: {
							cityName: { type: 'string', optional: true },
							provinceName: { type: 'string', optional: true },
							countryName: { type: 'string', empty: false },
						},
					},
				},
				exclude: {
					type: 'array',
					optional: true,
					items: {
						type: 'object',
						props: {
							cityName: { type: 'string', optional: true },
							provinceName: { type: 'string', optional: true },
							countryName: { type: 'string', empty: false },
						},
					},
				},
			},
			cache: false,
			async handler(ctx) {
				try {
					const { include, exclude } = ctx.params;
					for (const region of include) {
						this.validateLocation(
							region.cityName,
							region.provinceName,
							region.countryName,
						);
					}
					for (const region of exclude) {
						this.validateLocation(
							region.cityName,
							region.provinceName,
							region.countryName,
						);
					}
					//this.checkRegionInfo(include, exclude);
					// this.validateLocation(
					// 	include.cityName,
					// 	include.provinceName,
					// 	include.countryName,
					// );
					// this.validateLocation(
					// 	exclude.cityName,
					// 	exclude.provinceName,
					// 	exclude.countryName,
					// );

					return this.ruleGenerator(include, exclude);
				} catch (err) {
					throw Error(err.message);
				}
			},
		},
		check: {
			rest: {
				method: 'POST',
				path: '/check-permission',
			},
			params: {
				$$strict: true,
				distributorId: 'string',
				filmId: 'string',
				region: {
					type: 'object',
					props: {
						cityName: { type: 'string' },
						provinceName: { type: 'string' },
						countryName: { type: 'string', empty: false },
					},
				},
			},
			async handler(ctx) {
				try {
					const { distributorId, filmId, region } = ctx.params;
					let _rule = {};
					const _permissions = await this.broker.call(
						'v1.permission.find',
						{
							query: {
								filmId,
								distributorId,
							},
						},
					);
					// todo check empty
					console.log({ _permissions });
					_rule = _permissions[0].rule;

					const _region = [];
					if (region.countryName) {
						_region.push(region.countryName);
					}
					if (region.provinceName) {
						_region.push(region.provinceName);
					}
					if (region.cityName) {
						_region.push(region.cityName);
					}

					let _rightsOwner = _permissions[0].rightsOwner;
					while (_rightsOwner !== QUBE) {
						const _rightsOwnerPermissions = await this.broker.call(
							'v1.permission.find',
							{
								query: {
									filmId,
									distributorId: _rightsOwner,
								},
							},
						);
						console.log({ _rightsOwnerPermissions });
						//merge rule
						const _rights = this.checkRule(
							_rightsOwnerPermissions[0].rule,
							_region,
						);
						if (!_rights) {
							return {
								access: false,
							};
						}
						// _rule = jsonMerger.mergeObjects([_rule,_rightsOwnerPermissions[0].rule ]);
						_rightsOwner = _rightsOwnerPermissions[0].rightsOwner;
					}

					return { access: this.checkRule(_rule, _region) };
				} catch (err) {
					throw Error(err.message);
				}
			},
		},
	},
	events: {},
	methods: {
		checkRegionInfo(include, exclude) {
			const isIncludeEmpty = Object.values(include).every(
				(value) =>
					value === '' || value === null || value === undefined,
			);
			const isExcludeEmpty = Object.values(exclude).every(
				(value) =>
					value === '' || value === null || value === undefined,
			);

			if (isIncludeEmpty && isExcludeEmpty) {
				throw new Error('Distribution region list is empty');
			}
			const _cities = getCities();
			if (!isIncludeEmpty) {
				Object.keys(include).forEach((key) => {
					if (
						_.findIndex(
							_cities,
							(city) =>
								city[_.startCase(key)] ===
								_.trim(_.startCase(include[key])),
						) === -1 &&
						include[key] !== ''
					) {
						throw new Error('Invalid region in include');
					}
				});
			}
			if (!isExcludeEmpty) {
				Object.keys(exclude).forEach((key) => {
					if (
						_.findIndex(
							_cities,
							(city) =>
								city[_.startCase(key)] ===
								_.trim(_.startCase(exclude[key])),
						) === -1 &&
						exclude[key] !== ''
					) {
						throw new Error('Invalid region in exclude');
					}
				});
			}

			_.findIndex(_cities, (city) => {});
		},
		validateLocation(city, province, country) {
			const values = [city, province, country];
			const nonEmptyCount = values.filter(
				(value) => _.trim(value) !== '',
			).length;

			// Check if at least 2 values are non-empty
			if (nonEmptyCount < 2) {
				return true;
			}

			const _cities = getCities();

			const isValid = _cities.some(
				(entry) =>
					(!city ||
						entry['City Name'].toLowerCase() ===
							city.toLowerCase()) &&
					(!province ||
						entry['Province Name'].toLowerCase() ===
							province.toLowerCase()) &&
					(!country ||
						entry['Country Name'].toLowerCase() ===
							country.toLowerCase()),
			);

			if (!isValid) throw new Error('Invalid Location');
		},
		ruleGenerator(include, exclude) {
			let _rule = {};

			if (include) {
				for (const region of include) {
					_rule = this.setRule(_rule, region, true);
				}
			}

			if (exclude) {
				for (const region of exclude) {
					_rule = this.setRule(_rule, region, false);
				}
			}

			return _rule;
		},
		setRule(rule, region, access) {
			let _rule = rule;

			if (region.countryName && region.provinceName && region.cityName) {
				if (!_rule.hasOwnProperty(region.countryName)) {
					_rule[region.countryName] = { children: {} };
				}
				if (!_rule[region.countryName].hasOwnProperty('children')) {
					_rule[region.countryName] = {
						..._rule[region.countryName],
						children: {},
					};
				}

				if (
					!_rule[region.countryName]['children'].hasOwnProperty(
						region.provinceName,
					)
				) {
					_rule[region.countryName]['children'][region.provinceName] =
						{
							..._rule[region.countryName]['children'][
								region.provinceName
							],
							children: {},
						};
				}
				if (
					!_rule[region.countryName]['children'][
						region.provinceName
					].hasOwnProperty('children')
				) {
					_rule[region.countryName]['children'][region.provinceName] =
						{
							..._rule[region.countryName]['children'][
								region.provinceName
							],
							children: {},
						};
				}

				if (
					!_rule[region.countryName]['children'][region.provinceName][
						'children'
					].hasOwnProperty(region.cityName)
				) {
					_rule[region.countryName]['children'][region.provinceName][
						'children'
					][region.cityName] = {};
				}

				_rule[region.countryName]['children'][region.provinceName][
					'children'
				][region.cityName] = { access: access };
			} else if (region.countryName && region.provinceName) {
				if (!_rule.hasOwnProperty(region.countryName)) {
					_rule[region.countryName] = { children: {} };
				}
				if (!_rule[region.countryName].hasOwnProperty('children')) {
					_rule[region.countryName] = {
						..._rule[region.countryName],
						children: {},
					};
				}

				if (
					!_rule[region.countryName]['children'].hasOwnProperty(
						region.provinceName,
					)
				) {
					_rule[region.countryName]['children'][region.provinceName] =
						{};
				}
				_rule[region.countryName]['children'][region.provinceName] = {
					access: access,
				};
			} else if (region.countryName) {
				if (!_rule.hasOwnProperty(region.countryName)) {
					_rule[region.countryName] = {};
				}

				_rule[region.countryName] = {
					access: access,
				};
			}

			return _rule;
		},
		async checkPermission(id, filmId, rule) {
			const _permissions = await this.broker.call('v1.permission.find', {
				query: {
					filmId,
					distributorId: id,
				},
			});

			const index = _.findIndex(_permissions, (permission) => {
				const regex = this.translateRule(rule);
				if (regex.test(permission.rule)) {
					return permission.access === 'allow';
				}
			});

			if (index !== -1) {
				return _permissions[index].access;
			}
			console.log(rule);
			return false;
		},
		translateRule(rule) {
			const regexPattern = '^' + rule.replace(/\*/g, '[^/]+') + '$';
			return new RegExp(regexPattern, 'i');
		},
		checkRule(rule, region) {
			let current = rule;
			let _allow = null;
			for (let i = 0; i < region.length; i++) {
				let key = region[i];

				if (current[key]) {
					if (current[key].hasOwnProperty('allow')) {
						_allow = current[key].allow;
					}
					if (current[key].children) {
						current = current[key].children;
					}
				} else {
					break;
				}
			}
			if (_allow !== null) {
				return _allow;
			}
			return this.checkParentRule(rule, region);
		},
		checkParentRule(rule, region) {
			console.log('parent');
			let current = rule;
			for (let i = 0; i < region.length; i++) {
				let key = region[i];

				if (current[key]) {
					if (current[key].hasOwnProperty('allow')) {
						return current[key].allow;
					}

					if (current[key].children) {
						current = current[key].children;
					}
				} else {
					console.log('break');
					break;
				}
			}
			return false;
		},
	},
};
