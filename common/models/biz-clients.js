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

module.exports = function(Bizclients) {

	Bizclients.remoteMethod(
        'addEditClient', {
            http: {
                verb: 'post'
            },
            description: ["It will create client for the site."],
            accepts: [{
                arg: 'clientInfo',
                type: 'object',
                required: true,
                http: {
                    source: 'body'
                },
                {
                arg: 'businessSiteId',
                type: 'string',
                required: true,
                http: {
                    source: 'query'
                }
            }],
            returns: {
                type: 'object',
                root: true
            }
        }
    );

    Bizclients.addEditClient = (clientInfo,businessSiteId, cb) => {
    	// {
    	// 	"bizClientId":"",
    	// 	"firstName":"",
    	// 	"lastName":"",
    	// 	"email":"",
    	// 	"mobileNumber":"",
    	// 	"metaData":{}
    	// }

    	let clientData = clientInfo;

    	Bizclients.findOne(
    		{ where: { "bizClientId": convertObjectIdToString(bizData["bizClientId"]) }}
    	).then(bizUserInfo => {
    		if (isValidObject(bizUserInfo)) {
    			//Already exists
    			clientData["bizClientId"] = bizUserInfo["bizClientId"];
    			clientData["isActive"] = bizUserInfo["isActive"];

    			bizUserInfo.updateAttributes(clientData,function(err,respponse){
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
    			clientData["bizClientId"] = convertObjectIdToString(clientInfo["bizClientId"]);
    			clientData["isActive"] = true;
    			clientData["createdAt"] = new Date();

    			Bizclients.create(clientData).then(bizInfo=>{
    				return cb(null,bizInfo);
    			})catch(err=>{
    				return cb(new HttpErrors.InternalServerError('Error while creating new client.', {
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
