/*
download parallelly and then process data sequentially  
*/
define(
'ajax-core',
[],
function () {

	
	function _isValidArray(array){
		return array && Array.isArray(array);
	}

	function _isValidFunction(Fn){
		return Fn && typeof Fn === 'function';
	}

	function _isValidFnsArray(array){
		if(_isValidArray(array)){
			array.map(function(fn){
				if(!_isValidFunction){
					throw Error('error : funciton arrays');
				}
			});
		}
	}

	function _validateParams(params){
		if(_isValidArray(params.urls)){
			throw Error('error: urls array');
		}
		if(_isValidFnsArray(params.ajaxFns)){
			throw Error('error: ajaxFns array');
		}
	}

	function _serialize(obj) {
		if(obj && typeof obj === 'object'){
			var str = [];
			for (var p in obj){
				if (obj.hasOwnProperty(p)) {
					str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
				}
			}		
			return str.join("&");
		}
		return null;
	}

	function _get(url,data) {
		// Return a new promise.
		const query = _serialize(data);
		url += query ? ('?' + query) : '';
		return new Promise(function(resolve, reject) {
			// Do the usual XHR stuff
			var req = new XMLHttpRequest();
			req.setRequestHeader("Content-type", "application/json");
			
			req.open('GET', url);

			req.onload = function() {
				// This is called even on 404 etc
				// so check the status
				if (req.status>=200 && req.status<=299) {
					// Resolve the promise with the response text
					resolve(req.response);
				}
				else {
					// Otherwise reject with the status text
					// which will hopefully be a meaningful error
					reject(Error(req.statusText));
				}
			};

			// Handle network errors
			req.onerror = function() {
				reject(Error("Network Error"));
			};

			// Make the request
			req.send();
		});
	}

	var _pub = {};

	_pub.sqget = function(params){
		_validateParams(params);
		
		const urls = params.urls;
		const data = params.data;
		const thenFns = params.thenFns;
		const catchFns = params.catchFns;
		//get an array of promises
		urls.map(function(url,index){
			return _get(params.urls[index],params.data[index]);
		}).reduce(function(promiseSequence, currentPromise, index){
			//chain the promise
			return promiseSequence.then( function(){
				return currentPromise;
			}).then(function(data){
				if( _isValidFunction(thenFns[index])){
					return thenFns[index](data);
				}
			}).catch(function(err){
				if( _isValidFunction(catchFns[index]) ){
					catchFns[index](err);
				}
			});
		}, Promise.resolve())
		.catch(function(err){
			console.log(err);
		});
	};

	return _pub;
});
