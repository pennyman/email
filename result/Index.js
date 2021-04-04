'use strict';

var AWS = require("aws-sdk");
var sqs = new AWS.SQS({region: 'ap-northeast-2'});

var TASK_QUEUE_URL = 'sqs ';
var mysql = require('mysql');
var email = '';
var messageId = '';
var status = 0;

function deleteMessage(receiptHandle, cb) {
  sqs.deleteMessage({
    ReceiptHandle: receiptHandle,
    QueueUrl: TASK_QUEUE_URL
  }, cb);
}

function work(task, cb) {
  console.log(task);
  console.log(task.Records[0].body);
  var profile = JSON.parse(str(task.Records[0].body));
  console.log("notificationType");
  console.log(profile.notificationType);
  if(profile.notificationType == "Delivery"){
    status = 1;
  } else if(profile.notificationType == "Bounce"){
    status = 3;
  } else {
    status = 4;
  }

  console.log('mail');
  console.log(profile.mail);
  console.log('source');
  email = profile.mail.destination;
  console.log(email);
  var Array = JSON.parse(JSON.stringify(email));
  console.log(Array[0]);
  email = Array[0];
  console.log('messageId');
  messageId = profile.mail.messageId;
  console.log(messageId);

  console.log("ReceiptHandlePrev");
  console.log(task.Records[0].receiptHandle);

  sqs.deleteMessage({
    ReceiptHandle: task.Records[0].receiptHandle,
    QueueUrl: TASK_QUEUE_URL
  });

  console.log("ReceiptHandleNext");
  cb();
}

exports.handler = function(event, context, callback) {
  work(event, function(err) {
    if (err) {
      callback(err);
    } else {
      var connection = mysql.createConnection({
          host     : 'host주소',
          user     : '유저명',
          password : '패스워드',
          port     : 3306,
          database : '디비명'
      });

      connection.connect(function(error){
          if(error){
              console.log("Couldn't connect :( " + error);
          } else {
              console.log("Connected successfully~!");
          }
      });

      var sql = "INSERT INTO mail_suppression (email, status, reg_date) VALUES (?,?, now()) ON DUPLICATE KEY UPDATE status = ?, upd_date=now() ";
      var params = [email, status, status];
      connection.query(sql, params, function(err, rows, fields){
      	if(err){
      		console.log(err);
      	} else {
      		console.log(rows);
      	}
      });

      var resultSql = "INSERT INTO mail_result (message_id, email, status, reg_date) VALUES (?,?,?, now())";
      var resultParams = [messageId, email, status];
      connection.query(resultSql, resultParams, function(err, rows, fields){
      	if(err){
      		console.log(err);
      	} else {
      		console.log(rows.insertId);
      	}
      });

      connection.end(function(err) {
        // The connection is terminated now
        if (err) {
          console.error('[connection.end]err: ' + err);
          connection.destroy()
          return;
        }
        console.log('connection ended');
      });

    }
  });
};
