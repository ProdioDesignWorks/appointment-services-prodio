'use strict';

const HttpErrors = require('http-errors');
const {
    findReplace,
    unique,
    isValidObject,
    isValid,
    flattenArray,
    clean,
    isArray,
    isObject,
    print,
    isNull,
    convertObjectIdToString
} = require('../../utility/helper');
let async = require('async');

module.exports = function(Bizservicenproviderrelation) {

	Bizservicenproviderrelation.remoteMethod(
        'attachProvidersForService', {
            http: {  verb: 'post'  },
            description: ["It will attach providers with any service for the site."],
            accepts: [
            	{ arg: 'servicesInfo', type: 'array', required: true, http: { source: 'body'} },
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizservicenproviderrelation.attachProvidersForService = (servicesInfo,businessSiteId, cb) => {
    	// [
    	// 	{
    	// 		"serviceId":"",
    	// 		"providerId":""
    	// 	},
    	// 	{
    	// 		"serviceId":"",
    	// 		"providerId":""
    	// 	}
    	// ]
    }


    Bizservicenproviderrelation.remoteMethod(
        'attachServicesForProvider', {
            http: {  verb: 'post'  },
            description: ["It will attach providers with any service for the site."],
            accepts: [
            	{ arg: 'providerInfo', type: 'array', required: true, http: { source: 'body'} },
                { arg: 'businessSiteId', type: 'string', required: true, http: { source: 'query' } }
            ],
            returns: { type: 'object', root: true }
        }
    );

    Bizservicenproviderrelation.attachProvidersForService = (providerInfo,businessSiteId, cb) => {
    	// [
    	// 	{
    	// 		"providerId":"",
    	//      "serviceId":"",
    	// 	},
    	// 	{
    	//		"providerId":"",
    	// 		"serviceId":""
    	// 		
    	// 	}
    	// ]
    }

};
