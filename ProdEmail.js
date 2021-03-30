'use strict';

var AWS = require("aws-sdk");
var sqs = new AWS.SQS({region: 'ap-northeast-2'});
var ses = new AWS.SES({
   //accessKeyId:'AKIAIWJ4GXOBYXM6L6ZQ', //enter your accesskeyId
   //secretAccessKey:'3seIHIfrVfaTlq6JR5SjXqgNI/mosb3P06hM2ivL', // enter your secretAccessKey
   region: 'us-west-2'
});

var TASK_QUEUE_URL = 'https://sqs.ap-northeast-2.amazonaws.com/xxxxxx/prod-showprise-email-sqs';
var to = '';
var message = '';
var subject = '';
var from = '';


function deleteMessage(receiptHandle, cb) {
  sqs.deleteMessage({
    ReceiptHandle: receiptHandle,
    QueueUrl: TASK_QUEUE_URL
  }, cb);
}


function work(task, cb) {
  console.log(task.Records[0]);
  console.log(task.Records[0].body);
  var jsonData = JSON.stringify(task.Records[0].messageAttributes);
  console.log(jsonData);
  var profile = JSON.parse(jsonData);
  console.log("to");
  console.log(profile.to.stringValue);
  to = profile.to.stringValue;
  message = task.Records[0].body;
  subject = profile.subject.stringValue;
  from = profile.from.stringValue;
  console.log(profile.from.stringValue);

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
      var eParams = {
          Destination: {
              ToAddresses: [to]
          },
          Message: {
              Body: {
                Html: {
                    // HTML Format of the email
                    Charset: "UTF-8",
                    Data: message
                }
                // Text: {
                //       Data: message
                // }
              },
              Subject: {
                  Data: subject
              }
          },
          Source: from
      };

      console.log('===SENDING EMAIL===');

      // Create the promise and SES service object
      const sendPromise = ses
        .sendEmail(eParams)
        .promise();

      // Handle promise's fulfilled/rejected states
      sendPromise
        .then(data => {
          console.log("===EMAIL SENT===");
          console.log(data.MessageId);
          context.done(null, "Success");
        })
        .catch(err => {
          console.log("===EMAIL SENT2===");
          console.error(err, err.stack);
          context.done(null, "Failed");
        });

      // var email = ses.sendEmail(eParams, function(err, data){
      //     if(err) console.log(err);
      //     else {
      //         console.log("===EMAIL SENT===");
      //         console.log(data);
      //         console.log("EMAIL CODE END");
      //         console.log('EMAIL: ', email);
      //
      //         context.succeed(event);
      //     }
      // });

    }

  });
};
