SCOState = {
	"student_id": sco_data.student_id,
	"student_name": sco_data.student_name,
	"suspend_data": sco_data.suspend_data,
	"lesson_location": sco_data.lesson_location,
	"commit_url": sco_data.commit_url,
	"token": "",
	'site_url': sco_data.site_url,
	"entry": QueryString.entry
};
var _DEBUG = true;
window.API = API;
var _TEMP = '';
var _TEMP2 = '';

myInitError();
myCurrentState = -1;
cmi = new myCmi();
API.LMSInitialize = LMSInitialize;
API.LMSFinish = LMSFinish;
API.LMSGetValue = LMSGetValue;
API.LMSSetValue = LMSSetValue;
API.LMSCommit = LMSCommit;
API.LMSGetLastError = LMSGetLastError;
API.LMSGetErrorString = LMSGetErrorString;
API.LMSGetDiagnostic = LMSGetDiagnostic;
function API() { }
function LMSInitialize(parameter) {
	_TEMP = '';
	_TEMP2 = '';
	myInitError();
	myCurrentState = -1;
	cmi = new myCmi();
	try {
		return_value = myInitialize(parameter);
	}
	catch (e) {
		myErrorHandler(e);
	}
	finally {
		if (_DEBUG) console.log("Function: LMSInitialize SSSS\nArgument: '" + parameter + "' \nReturns: '" + return_value + "'");
	}
	return return_value;
}

function LMSFinish(parameter) {
	myInitError();
	try {
		return_value = myFinish(parameter);
	}
	catch (e) {
		myErrorHandler(e);
	}
	finally {
		if (_DEBUG) console.log("Function: LMSFinish \nArgument: '" + parameter + "' \nReturns: '" + return_value + "'");
	}
	return return_value;
}
function LMSGetValue(parameter) {
	if (_DEBUG) console.log("Entering LMSGetValue, argument: '" + parameter + "'");
	myInitError();
	return_value = myGetValues(parameter);
	if (_DEBUG) console.log("Exiting LMSGetValue, returns: '" + return_value + "'");
	return return_value;
}
function LMSSetValue(parameter, value) {
	if (_DEBUG) console.log("Entering LMSSetValue, argument: '" + parameter + "', set value: '" + value + "'");
	myInitError();
	return_value = mySetValues(parameter, value);
	if (_DEBUG) console.log("Exiting LMSSetValue, returns: '" + return_value + "'");
	return return_value;
}
function LMSCommit(parameter) {
	if (_DEBUG) console.log("Entering LMSCommit, argument: " + parameter);
	myInitError();
	return_value = myCommit(parameter);
	if (_DEBUG) console.log("Exiting LMSCommit, returns: " + return_value);
	return return_value;
}
function LMSGetLastError() {
	if (_DEBUG) console.log("GetLastError: " + myErrorNumber);
	return myErrorNumber;
}
function LMSGetErrorString(errorNumber) {
	if (_DEBUG) console.log("GetErrorString");
	return myGetErrorString(errorNumber);
}
function LMSGetDiagnostic(errorNumber) {
	if (_DEBUG) console.log("LMSGetDiagnostic with errorNumber: " + errorNumber);
	if (errorNumber == "") {
		return myErrorDiagnostic;
	}
	else {
		return myGetDiagnostic(errorNumber);
	}
}
function myInitialize(parameter) {
	return_value = "false";
	if (parameter != '') {
		throw new myError('201', 'Non-Empty parameter');
	}
	if (myCurrentState != -1 & myCurrentState != 1) {
		throw new myError('101', 'LMS not initialized');
	}
	else {
		myCurrentState = 0; return_value = "true";
	}
	return return_value;
}
function myFinish(parameter) {
	return_value = "false";
	if (parameter != '') {
		throw new myError('201', 'Non-Empty parameter');
	}
	if (myCurrentState != 0 && myCurrentState != 1) {
		throw new myError('301', 'LMS not initialized');
	}
	else {
		if (!(SCOState.lesson_status)) {
			if (SCOState.masteryscore) {
				if (cmi.core.score.raw.get() < SCOState.masteryscore) {
					SCOState.lesson_status = 'failed'; cmi.core.lesson_status.set('failed');
				}
				else {
					SCOState.lesson_status = 'passed'; cmi.core.lesson_status.set('passed');
				}
			}
			else {
				SCOState.lesson_status = 'completed'; cmi.core.lesson_status.set('completed');
			}
		}
		var exit = SCOState.scorm_exit;
		switch (exit) {
			case 'time-out': SCOState.entry = '';
				break;
			case 'suspend': SCOState.entry = 'resume';
				break;
			case 'logout': SCOState.entry = '';
				break;
			case '': SCOState.entry = '';
				break;
			default: SCOState.entry = '';
				break;
		}
		if (SCOState.session_time && SCOState.session_time != '') {
			SCOState.total_time = SCOState.session_time;
		}
		var st = JSON.stringify(SCOState);
		var setcall = $("#setcall").val();
		var coursemaster_id = $("#coursemaster_id").val();
		var course_unit_id = $("#course_unit_id").val();

		$.ajax({
			type: "POST",
			url: setcall,
			data: { str: st, coursemaster_id: coursemaster_id, course_unit_id: course_unit_id },
			success: function (response) {
				//alert(response);
			}
		});
		myCommit('finish');
		myCurrentState = 1; return_value = "true";
		this.timeout = setTimeout(function () {
			/*if (confirm('Are you want to start next course?'))
			{
				window.location.href=$("#next_course").val();
			}
			else
			{
				window.location.href="/lms/dashboard";
			}*/
			if ($("#show_as").val() == "Pop-up") {
				location.reload();
			}
		},
			0);
	}

	return return_value;
}
function myGetValues(property) {
	var return_value = "";
	try {
		checkState();
		property = checkParameter(property);
		console.log('All paramter==>' + property);
		eval('return_value = ' + property + '.get()');
	}
	catch (e) {
		myErrorHandler(e);
	}
	return return_value;
}
function mySetValues(property, value) {
	var return_value = "false";
	try {
		checkState();
		property = checkParameter(property);
		eval('return_value = ' + property + '.set(value)');
	}
	catch (e) {
		myErrorHandler(e);
	}
	return return_value;
}
function myCommit(parameter) {
	var return_value = "false";
	if (parameter != '' && parameter != 'finish') {
		myErrorHandler(new myError('201', 'Non-Empty parameter'));
		return return_value;
	}
	else {
		try {
			checkState();
			SCOState.credit = cmi.core.credit.get();
			SCOState.interactions = new Array();
			for (var i = 0; i < cmi.interactions.length; i++) {
				SCOState.interactions[i] = { "id": cmi.interactions[i].id.value, "latency": cmi.interactions[i].latency.value, "result": cmi.interactions[i].result.value, "student_response": cmi.interactions[i].student_response.value, "time": cmi.interactions[i].time.value, "type": cmi.interactions[i].type.value, "weighting": cmi.interactions[i].weighting.value, };
				SCOState.interactions[i].correct_responses = new Array(); for (var j = 0; j < cmi.interactions[i].correct_responses.length; j++) {
					SCOState.interactions[i].correct_responses[j] = { "pattern": cmi.interactions[i].correct_responses[j].pattern.value };
				}
			}
			console.log(SCOState);

			/*var st = JSON.stringify(SCOState);
	
			var setcall = $("#setcall").val();
			var coursemaster_id = $("#coursemaster_id").val();
			var course_unit_id = $("#course_unit_id").val();
	
			$.ajax({
				type: "POST",
				url: setcall,
				data: {str:st,coursemaster_id:coursemaster_id,course_unit_id:course_unit_id},
				success: function(response){
					//alert(response);
					}
				});*/
			$.ajax(sco_data.commit_url, {
				async: false,
				type: "post",
				data: $.param(SCOState),
				success: function (response) {
					//updateProgress(response);
					//updateSCORMProgress(response);
				},
			});
			return_value = "true";
		}
		catch (e) {
			myErrorHandler(e);
		}
		return return_value;
	}
}
function handleCommit(transport) { }
function myGetErrorString(errorNumber) {
	var errorStrings = new Array();
	errorStrings['0'] = 'No Error';
	errorStrings['101'] = 'General exception';
	errorStrings['201'] = 'Invalid argument error';
	errorStrings['202'] = 'Element cannot have children';
	errorStrings['203'] = 'Element not an array - cannot have count';
	errorStrings['301'] = 'Not initialized';
	errorStrings['401'] = 'Not implemented error';
	errorStrings['402'] = 'Invalid set value, element is a keyword';
	errorStrings['403'] = 'Element is read only';
	errorStrings['404'] = 'Element is write only';
	errorStrings['405'] = 'Incorrect Data Type';
	if (errorNumber == '') {
		return '';
	}
	else if ((typeof errorStrings[errorNumber]) == 'undefined') {
		return errorStrings[0];
	}
	else {
		return errorStrings[errorNumber];
	}
}
function myGetDiagnostic(errorNumber) {
	var errorDiagnostic = new Array();
	errorDiagnostic['0'] = 'Succesful operation. There were no errors';
	errorDiagnostic['101'] = 'A general fault occured - General exception';
	errorDiagnostic['201'] = 'You cannot set such value - Invalid argument error';
	errorDiagnostic['202'] = 'This element cannot have children - Element cannot have children';
	errorDiagnostic['203'] = 'This element is not an array - Element not an array - cannot have count';
	errorDiagnostic['301'] = 'System has to be initialized - Not initialized';
	errorDiagnostic['401'] = 'This property is not implemented - Not implemented error';
	errorDiagnostic['402'] = 'You cannot set a value to a keyword - Invalid set value, element is a keyword';
	errorDiagnostic['403'] = 'You can only read this element\'s value - Element is read only';
	errorDiagnostic['404'] = 'You can only write this element\'s value - Element is write only';
	errorDiagnostic['405'] = 'You cannot set this element to this value - Incorrect Data Type';
	if (errorNumber == "") errorNumber = myErrorNumber;
	return errorDiagnostic[errorNumber];
}
function checkState() {
	if (myCurrentState != 0) {
		throw new myError('301');
	}
}
function checkParameter(property) {

	str = property; str_split = property.split(".");

	if (!isNaN(parseInt(str_split[2]))) {
		k = 3;
		str = str_split[0] + '.' + str_split[1] + '[' + str_split[2] + ']';
		if (eval('typeof ' + str_split[0] + '.' + str_split[1]) == 'undefined') {
			throw new myError('201');
		}
		_TEMP = str_split[2];
		if (!(eval(str))) {
			var current_length = eval(str_split[0] + '.' + str_split[1] + '.length');
			if (str_split[2] > current_length) {
				throw new myError('201');
			}
			else {
				eval(str + '= new ' + str_split[1] + 'Object()');
			}
		}
		if (!isNaN(parseInt(str_split[4]))) {
			if (eval('typeof ' + str + '.' + str_split[3]) == 'undefined') {
				throw new myError('201');
			}
			_TEMP2 = str_split[4];
			var current_length = eval(str + '.' + str_split[3] + '.length');
			str += '.' + str_split[3] + '[' + str_split[4] + ']';
			if (str_split[4] > current_length) {
				throw new myError('201');
			}
			else {
				eval(str + '= new ' + str_split[3] + 'Object()');
			}
			k = 5;
		}
		for (var i = k; i < str_split.length; i++) {
			str += '.' + str_split[i];
		}
		property = str;
	}
	str_split = property.split(".");
	var temp_str = str_split[0];
	for (var i = 1; i < str_split.length; i++) {
		if (eval('typeof ' + temp_str) == 'undefined') {
			throw new myError('201');
		}
		temp_str = temp_str + '.' + str_split[i];
	}
	if (property == null || eval('typeof ' + property) == 'undefined') {
		var last_element = str_split.pop();
		if (last_element == '_children') {
			throw new myError('202');
		}
		else if (last_element == '_count') {
			throw new myError('203');
		}
		else {
			throw new myError('201');
		}
	}
	/*var getcall = $("#getcall").val();
	var coursemaster_id = $("#coursemaster_id").val();
	var course_unit_id = $("#course_unit_id").val();
	var callname = str_split[2];
	
	$.ajax({
		type: "POST",
		url: getcall,
		data: {callname:callname,coursemaster_id:coursemaster_id,course_unit_id:course_unit_id,flag:'getcall'},
		success: function(response){
			
			}
		});*/
	return property;
}
function checkDataType(parameter, data_model, type) {
	switch (data_model) {
		case 'CMIBlank': return match = /^$/.test(parameter);
			break;
		case 'CMIBoolean': return match = /^(true|false)$/.test(parameter);
			break;
		case 'CMIDecimal': return match = /^-?\d+(\.\d+)?$/i.test(parameter);
			break;
		case 'CMIFeedback': switch (type) {
			case 'true-false': return match = /^(0|1|t|f)$/.test(parameter);
				break;
			case 'choice': return match = /^[\w\d\s]+(,[\w\d\s]+)*$/i.test(parameter);
				break;
			case 'fill-in': return match = /^\s*.{1,255}$/i.test(parameter);
				break;
			case 'numeric': return match = /^-?\d+(\.\d+)?$/i.test(parameter);
				break;
			case 'likert': return match = /^[0-9a-z]?$/i.test(parameter);
				break;
			case 'matching': return match = /^[a-z0-9].[a-z0-9](,[a-z0-9].[a-z0-9])*$/i.test(parameter);
				break;
			case 'performance': return match = /^.{0,255}$/i.test(parameter);
				break;
			case 'sequencing': return match = /^[a-z0-9](,[a-z0-9])*$/i.test(parameter);
				break;
			default: return false;
				break;
		}
			break;
		case 'CMIIdentifier': return match = /^\S{1,1024}$/i.test(parameter);
			break;
		case 'CMIInteger': return match = (/^[0-9]{1,5}$/i.test(parameter) && parameter <= 65536);
			break;
		case 'CMISInteger': return match = (/^(\-|\+)?[0-9]{1,5}$/i.test(parameter) && parameter <= 32768 && parameter >= -32768);
			break;
		case 'CMIString255': return match = /^.{0,255}$/i.test(parameter);
			break;
		case 'CMIString4096': return match = /^.{0,65535}$/mi.test(parameter);
			break;
		case 'CMITime': match = (/^(\d\d):(\d\d):(\d\d)(.\d{1,2})?$/i.exec(parameter));
			if (match && match[1] < 24 && match[2] < 60 && match[3] < 60) {
				return true;
			}
			else {
				return false;
			}
			break;
		case 'CMITimespan': return match = /^\d{2,4}:\d\d:\d\d(.\d{1,2})?$/i.test(parameter);
			break;
		case 'CMIVocabulary': switch (type) {
			case 'Mode': return match = /^(normal|review|browse)$/.test(parameter);
				break;
			case 'Status': return match = /^(passed|completed|failed|incomplete|browsed|not attempted)$/.test(parameter);
				break;
			case 'Exit': return match = /^(time-out|suspend|logout|^)$/.test(parameter);
				break;
			case 'Credit': return match = /^(credit|no-credit)$/.test(parameter);
				break;
			case 'Entry': return match = /^(ab-initio|resume|^)$/.test(parameter);
				break;
			case 'Interaction': return match = /^(true-false|choice|fill-in|matching|performance|likert|sequencing|numeric)$/.test(parameter);
				break;
			case 'Result': return match = /^(correct|wrong|unanticipated|neutral|(-?\d+(\.\d+)?))$/.test(parameter);
				break;
			case 'TimeLimitAction': return match = /^(exit,message|exit,no message|continue,message|continue,no message)$/.test(parameter);
				break;
			default: return false;
				break;
		}
		default: return false;
			break;
	}
}
function myError(errorNumber, errorMessage) {
	this.errorNumber = errorNumber;
	this.errorMessage = errorMessage;
}
function myErrorHandler(err) {
	console.log(err);
	if (err instanceof myError) {
		myErrorNumber = err.errorNumber;
		if (err.errorMessage) {
			myErrorDiagnostic = err.errorMessage;
		}
		else {
			myErrorDiagnostic = myGetDiagnostic(err.errorNumber);
		}
	}
	else throw err;
}
function myInitError() {
	myErrorNumber = '0'; myErrorDiagnostic = myGetDiagnostic(myErrorNumber);
}
function myCmi() {
	this.core = new function () {
		var _children = function () {
			this.value = 'student_id, student_name, lesson_location, credit, lesson_status, entry, score, total_time, lesson_mode, exit, session_time'; this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				throw new myError('402');
			};
		};
		var student_id = function () {
			this.value = sco_data.student_id;
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				throw new myError('403');
			};
		};
		var student_name = function () {
			this.value = sco_data.student_name;
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				throw new myError('403');
			};
		};
		var lesson_location = function () {
			this.value = ''; this.get = function () {
				if (typeof SCOState.lesson_location != 'undefined') {
					this.value = SCOState.lesson_location;
				}
				var getcall = $("#getcall").val();
				var coursemaster_id = $("#coursemaster_id").val();
				var course_unit_id = $("#course_unit_id").val();
				var callname = 'lesson_location';

				$.ajax({
					type: "POST",
					url: getcall,
					async: false,
					data: { callname: callname, coursemaster_id: coursemaster_id, course_unit_id: course_unit_id, flag: 'getcall' },
					success: function (response) {
						$("#last_location").val(response);
					}
				});
				var last_location = $("#last_location").val();
				//return last_location;
				return this.value;
			};
			this.set = function (param) {
				if (!checkDataType(param, 'CMIString255', false)) {
					throw new myError('405');
				}
				else {
					this.value = param;
					SCOState.lesson_location = this.value; return "true";
				}
			};
		};
		var credit = function () {
			this.value = 'credit'; this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				throw new myError('403');
			};
		};
		var lesson_status = function () {
			this.value = 'not attempted';
			this.get = function () {
				if (SCOState.lesson_status) {
					this.value = SCOState.lesson_status;
				}
				return this.value;
			};
			this.set = function (param) {
				count = 0;
				if (!checkDataType(param, 'CMIVocabulary', 'Status') || param == 'not attempted') {
					throw new myError('405');
				}
				else {
					this.value = param;
					SCOState.lesson_status = this.value;
					return "true";
				}
			};
		};
		var entry = function () {
			this.get = function () {
				console.log(SCOState.entry);
				if ((typeof SCOState.entry) != 'undefined') {
					this.value = SCOState.entry;
					var getcall = $("#getcall").val();
					var coursemaster_id = $("#coursemaster_id").val();
					var course_unit_id = $("#course_unit_id").val();
					var callname = 'entry';
					console.log(SCOState.entry);
					$.ajax({
						type: "POST",
						url: getcall,
						async: false,
						data: { callname: callname, coursemaster_id: coursemaster_id, course_unit_id: course_unit_id, flag: 'getcall' },
						success: function (response) {
							//$("#last_suspend").val(response);
						}
					});
				}
				return this.value;
			};
			this.set = function (param) {
				throw new myError('403');
			};
		};
		var score = function () {
			var _children = function () {
				this.value = 'raw,min,max';
				this.get = function () {
					return this.value;
				};
				this.set = function (param) {
					throw new myError('402');
				};
			};
			var raw = function () {
				this.value = '';
				this.get = function () {
					return this.value;
				};
				this.set = function (param) {
					if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false)) {
						throw new myError('405');
					}
					else {
						this.value = param;
						SCOState.score = this.value;
						return "true";
					}
				};
			};
			var max = function () {
				this.value = '';
				this.get = function () {
					return this.value;
				};
				this.set = function (param) {
					if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false)) {
						throw new myError('405');
					}
					else {
						this.value = param; SCOState.maxscore = this.value; return "true";
					}
				};
			};
			var min = function () {
				this.value = '';
				this.get = function () {
					return this.value;
				};
				this.set = function (param) {
					if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false)) {
						throw new myError('405');
					}
					else {
						this.value = param; SCOState.minscore = this.value;
						return "true";
					}
				};
			};
			this._children = new _children();
			this.raw = new raw();
			this.max = new max();
			this.min = new min();
		};
		var total_time = function () {
			this.value = '0000:00:00.00';
			this.get = function () {
				if (SCOState.total_time) {
					this.value = SCOState.total_time;
				}
				return this.value;
			};
			this.set = function (param) {
				throw new myError('403');
			};
		};
		var lesson_mode = function () {
			this.value = 'normal';
			this.get = function () {
				if (SCOState.lesson_mode) {
					this.value = SCOState.lesson_mode;
				}
				return this.value;
			};
			this.set = function (param) {
				throw new myError('403');
			};
		};
		var exit = function () {
			this.value = '';
			this.get = function () {
				throw new myError('404');
			};
			this.set = function (param) {
				count = 0;
				if (!checkDataType(param, 'CMIVocabulary', 'Exit')) {
					throw new myError('405');
				}
				else {
					this.value = param;
					SCOState.scorm_exit = this.value;
					return "true";
				}
			};
		};
		var session_time = function () {
			this.value = '';
			this.get = function () {
				throw new myError('404');
			};
			this.set = function (param) {
				if (!checkDataType(param, 'CMITimespan', false)) {
					throw new myError('405');
				}
				else {
					this.value = param;
					SCOState.session_time = this.value;
					return "true";
				}
			};
		};
		this._children = new _children();
		this.student_id = new student_id();
		this.student_name = new student_name();
		this.lesson_location = new lesson_location();
		this.credit = new credit();
		this.lesson_status = new lesson_status();
		this.entry = new entry();
		this.score = new score();
		this.total_time = new total_time();
		this.lesson_mode = new lesson_mode();
		this.exit = new exit();
		this.session_time = new session_time();
	};
	this.suspend_data = new function () {
		this.value = ''; var last_suspend = this.value;
		this.get = function () {
			if (SCOState.suspend_data) {
				this.value = SCOState.suspend_data;
			}
			var getcall = $("#getcall").val();
			var coursemaster_id = $("#coursemaster_id").val();
			var course_unit_id = $("#course_unit_id").val();
			var callname = 'suspend_data';

			$.ajax({
				type: "POST",
				url: getcall,
				async: false,
				data: { callname: callname, coursemaster_id: coursemaster_id, course_unit_id: course_unit_id, flag: 'getcall' },
				success: function (response) {
					//$("#last_suspend").val(response);
				}
			});
			//var last_suspend = $("#last_suspend").val();
			//return last_suspend;
			return this.value;
		};
		this.set = function (param) {
			if (!checkDataType(param, 'CMIString4096', false)) {
				throw new myError('405');
			}
			else {
				this.value = param;
				SCOState.suspend_data = this.value;
				return "true";
			}
		};
	};
	this.launch_data = new function () {
		this.value = '';
		this.get = function () {
			if (SCOState.datafromlms) {
				this.value = SCOState.datafromlms;
			}
			return this.value;
		};
		this.set = function (param) {
			throw new myError('403');
		};
	};
	this.comments = new function () {
		this.value = '';
		this.get = function () {
			return this.value;
		};
		this.set = function (param) {
			if (!checkDataType(param, 'CMIString4096', false)) {
				throw new myError('405');
			}
			else {
				this.value += param;
				SCOState.comments = this.value;
				return "true";
			}
		};
	};
	this.comments_from_lms = new function () {
		this.value = '';
		this.get = function () {
			if (SCOState.comments_from_lms) {
				this.value = SCOState.comments_from_lms;
			}
			return this.value;
		};
		this.set = function (param) {
			throw new myError('403');
		};
	};
	this.student_data = new function () {
		var _children = function () {
			this.value = 'mastery_score,max_time_allowed,time_limit_action';
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				throw new myError('402');
			};
		};
		var mastery_score = function () {
			this.value = '';
			this.get = function () {
				if (SCOState.masteryscore) {
					this.value = SCOState.masteryscore;
				}
				return this.value;
			};
			this.set = function (param) {
				throw new myError('403');
			};
		};
		var max_time_allowed = function () {
			this.value = '';
			this.get = function () {
				if (SCOState.maxtimeallowed) {
					this.value = SCOState.maxtimeallowed;
				}
				return this.value;
			};
			this.set = function (param) {
				throw new myError('403');
			};
		};
		var time_limit_action = function () {
			this.value = '';
			this.get = function () {
				if (SCOState.timelimitaction) {
					this.value = SCOState.timelimitaction;
				}
				return this.value;
			};
			this.set = function (param) {
				throw new myError('403');
			};
		};
		this._children = new _children();
		this.mastery_score = new mastery_score();
		this.max_time_allowed = new max_time_allowed();
		this.time_limit_action = new time_limit_action();
	};
	this.student_preference = new function () {
		var _children = function () {
			this.value = 'language,speech,audio,speed,text';
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				throw new myError('402');
			};
		};
		var audio = function () {
			this.value = '';
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				if (!checkDataType(param, 'CMISInteger', false) || param < -1 || param > 100) {
					throw new myError('405');
				}
				else {
					this.value = param; return "true";
				}
			};
		};
		var language = function () {
			this.value = 'english';
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				if (!checkDataType(param, 'CMIString255', false)) {
					throw new myError('405');
				}
				else {
					this.value = param;
					return "true";
				}
			};
		};
		var speed = function () {
			this.value = '0';
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				if (!checkDataType(param, 'CMISInteger', false) || param < -100 || param > 100) {
					throw new myError('405');
				}
				else {
					this.value = param;
					return "true";
				}
			};
		};
		var text = function () {
			this.value = '0';
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				if (!checkDataType(param, 'CMISInteger', false) || (param != "1" && param != "0" && param != "-1")) {
					throw new myError('405');
				}
				else {
					this.value = param;
					return "true";
				}
			};
		};
		this._children = new _children();
		this.audio = new audio();
		this.language = new language();
		this.speed = new speed();
		this.text = new text();
	};
	var objectives = new Array();
	objectives._children = new function () {
		this.value = 'id,score,status';
		this.get = function () {
			return this.value;
		};
		this.set = function (param) {
			throw new myError('402');
		};
	};
	objectives._count = new function () {
		this.get = function () {
			return cmi.objectives.length;
		};
		this.set = function (param) {
			throw new myError('402');
		};
	};
	this.objectives = objectives;
	var interactions = new Array();
	interactions._children = new function () {
		this.value = 'id,objectives,time,type,correct_responses,weighting,student_response,result,latency';
		this.get = function () {
			return this.value;
		};
		this.set = function (param) {
			throw new myError('402');
		};
	};
	interactions._count = new function () {
		this.get = function () {
			return cmi.interactions.length;
		};
		this.set = function (param) {
			throw new myError('402');
		};
	};
	this.interactions = interactions;
}; objectivesObject = function () {
	this.value = null;
	this.id = new function () {
		this.get = function () {
			if (this.value === null) {
				this.value = '';
				throw new myError('201');
			}
			return this.value;
		};
		this.set = function (param) {
			if (!checkDataType(param, 'CMIIdentifier', false)) {
				throw new myError('405');
			}
			else {
				this.value = param;
				return "true";
			}
		};
	};
	this.score = new function () {
		this._children = new function () {
			this.value = 'raw,min,max';
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				throw new myError('402');
			};
		};
		this.raw = new function () {
			this.value = '';
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false)) {
					throw new myError('405');
				}
				else {
					this.value = param;
					SCOState.score = this.value;
					return "true";
				}
			};
		};
		this.max = new function () {
			this.value = '';
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false)) {
					throw new myError('405');
				}
				else {
					this.value = param;
					SCOState.maxscore = this.value;
					return "true";
				};
			};
		};
		this.min = new function () {
			this.value = '';
			this.get = function () {
				return this.value;
			};
			this.set = function (param) {
				if ((!checkDataType(param, 'CMIDecimal', false) || param < 0 || param > 100) && !checkDataType(param, 'CMIBlank', false)) {
					throw new myError('405');
				}
				else {
					this.value = param;
					SCOState.minscore = this.value;
					return "true";
				}
			};
		};
	};
	this.status = new function () {
		this.value = 'not attempted';
		this.get = function () {
			if (SCOState.lesson_status) {
				this.value = SCOState.lesson_status;
			}
			return this.value;
		};
		this.set = function (param) {
			count = 0;
			if (!checkDataType(param, 'CMIVocabulary', 'Status')) {
				throw new myError('405');
			}
			else {
				this.value = param;
				SCOState.lesson_status = this.value;
				return "true";
			}
		};
	};
};
interactionsObject = function () {
	this.id = new function () {
		this.value = '';
		this.get = function () {
			throw new myError('404');
		};
		this.set = function (param) {
			if (!checkDataType(param, 'CMIIdentifier', false)) {
				throw new myError('405');
			}
			else {
				this.value = param;
				return "true";
			}
		};
	};
	var objectives = new Array();
	objectives._count = new function () {
		this.set = function (param) {
			throw new myError('402');
		};
	};
	objectives._count.get = function () {
		return objectives.length;
	};
	this.objectives = objectives;
	this.time = new function () {
		this.value = '';
		this.get = function () {
			throw new myError('404');
		};
		this.set = function (param) {
			if (!checkDataType(param, 'CMITime', false)) {
				throw new myError('405');
			}
			else {
				this.value = param;
				return "true";
			}
		};
	};
	this.type = new function () {
		this.value = '';
		this.get = function () {
			throw new myError('404');
		};
		this.set = function (param) {
			if (!checkDataType(param, 'CMIVocabulary', 'Interaction')) {
				throw new myError('405');
			}
			else {
				this.value = param;
				return "true";
			}
		};
		this.getValue = function () {
			return this.value;
		};
	};
	var correct_responses = new Array();
	correct_responses._count = new function () {
		this.set = function (param) {
			throw new myError('402');
		};
	};
	correct_responses._count.get = function () {
		return correct_responses.length;
	};
	this.correct_responses = correct_responses;
	this.weighting = new function () {
		this.value = '';
		this.get = function () {
			throw new myError('404');
		};
		this.set = function (param) {
			if (!checkDataType(param, 'CMIDecimal', false)) {
				throw new myError('405');
			}
			else {
				this.value = param;
				return "true";
			}
		};
	};
	this.student_response = new function () {
		this.value = '';
		this.get = function () {
			throw new myError('404');
		};
		this.set = function (param) {
			if (!checkDataType(param, 'CMIFeedback', cmi.interactions[_TEMP].type.getValue())) {
				throw new myError('405');
			}
			else {
				this.value = param;
				return "true";
			}
		};
	};
	this.result = new function () {
		this.value = '';
		this.get = function () {
			throw new myError('404');
		};
		this.set = function (param) {
			if (!checkDataType(param, 'CMIVocabulary', 'Result')) {
				throw new myError('405');
			}
			else {
				this.value = param;
				return "true";
			}
		};
	};
	this.latency = new function () {
		this.value = '';
		this.get = function () {
			throw new myError('404');
		};
		this.set = function (param) {
			if (!checkDataType(param, 'CMITimespan', false)) {
				throw new myError('405');
			}
			else {
				this.value = param;
				return "true";
			}
		};
	};
};
correct_responsesObject = function () {
	this.pattern = new function () {
		this.value = '';
		this.get = function () {
			throw new myError('404');
		};
		this.set = function (param) {
			if (!checkDataType(param, 'CMIFeedback', cmi.interactions[_TEMP].type.getValue())) {
				throw new myError('405');
			}
			else {
				this.value = param; return "true";
			}
		};
	};
};
