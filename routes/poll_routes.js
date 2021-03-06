const express = require('express');
const router = express.Router({ mergeParams: true });
const { insertNewPoll, updateURLs, insertOptions } = require('../db/queries/insert_new_poll.js');
const { getUserDetails } = require('../db/queries/user_queries.js');
const { sendMail } = require('../helpers/helpers.js');
require('dotenv').config();


const { getUser } = require('../db/queries/user_queries.js');
//endpoint to handle post requests to add basic poll info to database
router.post('/:u_id', (req, res) => {
  if (!(req.session && req.session.user_id) || req.session.user_id !== Number(req.params.u_id)) {
    res.status(403).send('<h3>You must be logged in .</h3>');
    return;
  }
  const newPoll = {user_id: req.params.u_id, title: req.body.title, desc: req.body.desc, nums: req.body.nums};
  console.log(newPoll)
  return insertNewPoll(newPoll)
  .then(poll => {
    req.session.poll_id = poll[0].id;
    console.log(req.session.user_id);
    console.log(req.session.poll_id);
    console.log("xyzyx");
    res.redirect(`/poll/${poll[0].user_id}/${poll[0].id}`)
  })
  .catch(er => console.log('ERROR',er))
});

//stores options in options table. handles the post request sent to store the options. post request received at /poll/user id/poll id
router.post('/:u_id/:poll_id', (req, res) => {
  if (!(req.session && req.session.user_id) || req.session.user_id !== Number(req.params.u_id) || req.session.poll_id !== Number(req.params.poll_id)) {
    res.status(403).send('<h3>You must be logged in and have a valid poll id.</h3>');
    return;
  }
  console.log(req.body);
  const ops = req.body;
  for (let op in ops) {
     let data = {choice : ops[op], poll_id : req.params.poll_id}
     insertOptions(data)
     .catch(e => console.log(ERROR, e));
  }

  return getUserDetails(req.params)
  .then((resp) => {
    console.log("hahahahaha");
    console.log(resp.rows);
    console.log("sosos");
    const links = {admin : resp.rows[0].admin_url, voting : resp.rows[0].voting_url};
    console.log("lolol");
    sendMail(resp.rows[0].email, resp.rows[0].name, links);
    console.log("momomom");
    res.json('Done!');
  })
  .catch((e) => {
    console.log(ERROR, e);
  })
  //
  //res.redirect(`/admin/${req.params.u_id}/${req.params.poll_id}`);

});
//endpoint to handle GETs received at /:u_id. loads the create poll page
router.get('/:u_id', (req, res) => {
  if (!(req.session && req.session.user_id) || req.session.user_id !== Number(req.params.u_id)) {
    res.status(403).send('<h3>You must be logged in .....</h3>');
    return;
  }
  return getUser(req.params.u_id)
  .then((resp) => {
    console.log("lplplplpl");
    console.log(resp);
    console.log(resp['email']);
    const templateVars = {user : resp};
    res.render('create_poll', templateVars);
  })
  .catch(er => console.log('ERROR',er));
});
//Renders admin_poll page where the user enters their options
router.get('/:u_id/:poll_id', (req, res) => {
  let userObj;
  if (!(req.session && req.session.user_id) || req.session.user_id !== Number(req.params.u_id) || req.session.poll_id !== Number(req.params.poll_id)) {
    res.status(403).send('<h3>You must be logged in and have an active poll id.</h3>');
    return;
  }
  return updateURLs(req.params)
  .then((results) => {
    console.log(results);
    userObj = {email : req.session.email, id : req.session.user_id };
    const templateVars = {user: userObj, poll_id: req.params.poll_id, opNum : results[0].numops}
    res.render('admin_poll', templateVars)
  })
  .catch(er => console.log('ERROR',er))
});
//User enters title and description of poll, redirects to poll/:id after storing poll in db
// //Posts the entered options
// router.post('/:poll_id', (req, res) => {
//   const options = req.body;
//   console.log(options);
//   const pollID = Number(req.params.poll_id);
//   for (let i = 1; i <= Object.keys(options).length; i++) {
//     const op = `op${i}`;
//     if (options[op]) {
//       insertOptions(options[op], pollID)
//       .catch(e => console.log(e))
//     }
//     if (!options[op]) {
//     }
//   }
//   res.redirect(`/vote/${pollID}`);
// });
module.exports = router;
