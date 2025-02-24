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
				filmId: 'string',
				distributorId: 'string',
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
					const {
						include,
						exclude,
						rightsOwner,
						distributorId,
						filmId,
					} = ctx.params;
					for (const region of include) {
						this.validateLocation(
							region.cityName,
							region.provinceName,
							region.countryName,
						);
						if (rightsOwner !== QUBE) {
							const _access = await ctx.call(
								'v1.distribution.check',
								{
									distributorId: rightsOwner,
									filmId,
									region,
								},
							);
							console.log(_access);
							if (_access && !_access.access) {
								throw new Error(
									'Rights Owner Not authorized to perform this action',
								);
							}
						}
					}
					for (const region of exclude) {
						this.validateLocation(
							region.cityName,
							region.provinceName,
							region.countryName,
						);

						if (rightsOwner !== QUBE) {
							const _access = await ctx.call(
								'v1.distribution.check',
								{
									distributorId: rightsOwner,
									filmId,
									region,
								},
							);
							console.log(_access);
							if (_access && !_access.access) {
								throw new Error(
									'Rights Owner Not authorized to perform this action',
								);
							}
						}
					}

					const _genRule = this.ruleGenerator(include, exclude);
					const res = ctx.call('v1.permission.create', {
						filmId,
						distributorId,
						rightsOwner,
						rule: _genRule,
					});
					return res;
				} catch (err) {
					throw new Error(err.message);
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
					if (!_permissions) {
						throw new Error('Permissions not found');
					}
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
				let _country = _.kebabCase(region.countryName);
				let _province = _.kebabCase(region.provinceName);
				let _city = _.kebabCase(region.cityName);

				if (!_rule.hasOwnProperty(_country)) {
					_rule[_country] = { children: {} };
				}
				if (!_rule[_country].hasOwnProperty('children')) {
					_rule[_country] = {
						..._rule[_country],
						children: {},
					};
				}

				if (!_rule[_country]['children'].hasOwnProperty(_province)) {
					_rule[_country]['children'][_province] = {
						..._rule[_country]['children'][_country],
						children: {},
					};
				}
				if (
					!_rule[_country]['children'][_province].hasOwnProperty(
						'children',
					)
				) {
					_rule[_country]['children'][_province] = {
						..._rule[_country]['children'][_province],
						children: {},
					};
				}

				if (
					!_rule[_country]['children'][_province][
						'children'
					].hasOwnProperty(_city)
				) {
					_rule[_country]['children'][_province]['children'][_city] =
						{};
				}

				_rule[_country]['children'][_province]['children'][_city] = {
					..._rule[_country]['children'][_province]['children'][
						_city
					],
					access: access,
				};
			} else if (region.countryName && region.provinceName) {
				let _country = _.kebabCase(region.countryName);
				let _province = _.kebabCase(region.provinceName);

				if (!_rule.hasOwnProperty(_country)) {
					_rule[_country] = { children: {} };
				}
				if (!_rule[_country].hasOwnProperty('children')) {
					_rule[_country] = {
						..._rule[_country],
						children: {},
					};
				}

				if (!_rule[_country]['children'].hasOwnProperty(_province)) {
					_rule[_country]['children'][_province] = {};
				}
				_rule[_country]['children'][_province] = {
					..._rule[_country]['children'][_province],
					access: access,
				};
			} else if (region.countryName) {
				let _country = _.kebabCase(region.countryName);
				if (!_rule.hasOwnProperty(_country)) {
					_rule[_country] = {};
				}

				_rule[_country] = {
					..._rule[_country],
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
				let key = _.kebabCase(region[i]);

				if (current[key]) {
					if (current[key].hasOwnProperty('access')) {
						_allow = current[key].access;
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
			console.log(region);
			let current = rule;
			for (let i = 0; i < region.length; i++) {
				let key = _.kebabCase(region[i]);
				console.log(current[key]);
				if (current[key]) {
					if (current[key].hasOwnProperty('access')) {
						return current[key].access;
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
