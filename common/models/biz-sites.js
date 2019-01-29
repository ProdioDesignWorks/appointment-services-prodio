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

module.exports = function(Bizsites) {

	Bizsites.remoteMethod(
        'createUpdateBusinessSite', {
            http: {
                verb: 'post'
            },
            description: ["It will create business site."],
            accepts: [{
                arg: 'bizData',
                type: 'object',
                required: false,
                http: {
                    source: 'body'
                }
            }],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Bizsites.createUpdateBusinessSite = (bizData, cb) => {
    	
    	let businessData = bizData;

    	Bizsites.findOne(
    		{ where: { "bizSiteId": convertObjectIdToString(bizData["bizSiteId"]) }}
    	).then(bizInfo => {
    		if (isValidObject(bizInfo)) {
    			//Already exists
    			businessData["bizSiteId"] = bizInfo["bizSiteId"];
    			businessData["isActive"] = bizInfo["isActive"];

    			bizInfo.updateAttributes(businessData,function(err,respponse){
                    if(err){
                        return cb(new HttpErrors.InternalServerError('Internal Server Error '+JSON.stringify(err), {
                            expose: false
                        }));
                    }else{
                        cb(null,respponse);
                    }
                });
    		}else{
    			//create new
    			bizData["bizSiteId"] = convertObjectIdToString(bizData["bizSiteId"]);
    			bizData["isActive"] = true;
    			bizData["createdAt"] = new Date();

    			Bizsites.create(bizData).then(bizInfo=>{
    				return cb(null,bizInfo);
    			}).catch(err=>{
    				return cb(new HttpErrors.InternalServerError('Error while creating new business.', {
	                    expose: false
	                })); 
    			});
    		}
        }).catch(error => {
            let _msg = isNull(error["message"]) ? 'Internal Server Error' : error["message"];
            const err = new HttpErrors.InternalServerError(_msg, {
                expose: false
            });
            return cb(err);
        });
    }


};
