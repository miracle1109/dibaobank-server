const con = require("../db/conn");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const multer = require("multer");

const genToken = (user) => {
  return jwt.sign(
    {
      iss: "Joan_Louji",
      sub: user.id,
      // iat: new Date().getTime(),
    },
    "joanlouji",
    // "Stack",
    {
      expiresIn: "3d",
    }
  );
};

const register = async (datas, callback) => {
  const salt = await bcrypt.genSalt(10);
  datas.password = await bcrypt.hash(datas.password, salt);
  datas.withdrawl_password = await bcrypt.hash(datas.withdrawl_password, salt);
  let sql =
    "insert into users(name, email, address, password, withdrawl_password)\
              Value(?, ?, ?, ?, ?)";
  let args = [
    datas.name,
    datas.email,
    datas.address,
    datas.password,
    datas.withdrawl_password,
  ];
  con.query(sql, args, function (err, result) {
    if (err) {
      console.log("register error" + err);
      callback(err, null);
    } else {
      callback(null, "success");
    }
  });
};

const login = (datas, callback) => {
  let sql = "select * from users where name = ?";
  var args = [datas.name];
  con.query(sql, args, function (err, result) {
    if (err) {
      res.json({ err: err });
    } else {
      if (result.length > 0) {
        let user = JSON.parse(JSON.stringify(result[0]));
        bcrypt.compare(datas.password, user.password, (err, comRes) => {
          if (comRes) {
            const newUser = {
              id: user.id,
              name: user.name,
            };
            user.token = genToken(newUser);
            callback(null, user);
          } else {
            callback("invalid user", null);
          }
        });
      } else {
        callback("invalid user", null);
      }
    }
  });
};

const changeLoginPassword = async (datas, callback) => {
  const salt = await bcrypt.genSalt(10);
  datas.newPassword = await bcrypt.hash(datas.newPassword, salt);
  let sql = "select * from users where id = ?";
  var args = [datas.id];
  con.query(sql, args, function (err, result) {
    if (err) {
      res.json({ err: err });
    } else {
      if (result.length > 0) {
        console.log("aaa");
        let user = JSON.parse(JSON.stringify(result[0]));
        bcrypt.compare(datas.oldPassword, user.password, (err, comRes) => {
          if (comRes) {
            let sql = "update users set password=? where id=?";
            let args = [datas.newPassword, datas.id];
            con.query(sql, args, function (err, result) {
              if (err) {
                callback("update loginpass error", null);
              } else {
                callback(null, "success");
              }
            });
          } else {
            callback("wrongpassword", null);
          }
        });
      } else {
        callback("invalid user", null);
      }
    }
  });
};

const changeWithdrawlPassword = async (datas, callback) => {
  const salt = await bcrypt.genSalt(10);
  datas.newPassword = await bcrypt.hash(datas.newPassword, salt);
  let sql = "select * from users where id = ?";
  var args = [datas.id];
  con.query(sql, args, function (err, result) {
    if (err) {
      res.json({ err: err });
    } else {
      if (result.length > 0) {
        let user = JSON.parse(JSON.stringify(result[0]));
        bcrypt.compare(
          datas.oldPassword,
          user.withdrawl_password,
          (err, comRes) => {
            if (comRes) {
              let sql = "update users set withdrawl_password=? where id=?";
              let args = [datas.newPassword, datas.id];
              con.query(sql, args, function (err, result) {
                if (err) {
                  callback("update loginpass error", null);
                } else {
                  callback(null, "success");
                }
              });
            } else {
              callback("wrongpassword", null);
            }
          }
        );
      } else {
        callback("invalid user", null);
      }
    }
  });
};

const uploadFile = (datas, callback) => {
  let uploadFile = datas.files.file;
  const name = uploadFile.name;
  const saveAs = Date.now() + datas.body.trackNum + uploadFile.md5 + name;
  uploadFile.mv(`${__dirname}/../uploads/${saveAs}`, function (err) {
    if (err) {
      return res.status(500).send(err);
    } else {
      let nowday = dateFormat(new Date(), "%Y-%m-%d %H:%M:%S", true);
      let sql =
        "insert into invoices(userId, filename, trackingNum, created_at, suiteId, action)\
                 values(?, ?, ?, ?, ?, ?)";
      let args = [datas.body.userId, saveAs, datas.body.trackNum, nowday, 0, 0];
      con.query(sql, args, function (err, result) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, "success");
        }
      });
    }
  });
};

const dateFormat = (date, fstr, utc) => {
  utc = utc ? "getUTC" : "get";
  return fstr.replace(/%[YmdHMS]/g, function (m) {
    switch (m) {
      case "%Y":
        return date[utc + "FullYear"](); // no leading zeros required
      case "%m":
        m = 1 + date[utc + "Month"]();
        break;
      case "%d":
        m = date[utc + "Date"]();
        break;
      case "%H":
        m = date[utc + "Hours"]();
        break;
      case "%M":
        m = date[utc + "Minutes"]();
        break;
      case "%S":
        m = date[utc + "Seconds"]();
        break;
      default:
        return m.slice(1); // unknown code, remove %
    }
    // add leading zero if required
    return ("0" + m).slice(-2);
  });
};

exports.register = register;
exports.login = login;
exports.uploadFile = uploadFile;
exports.dateFormat = dateFormat;
exports.changeLoginPassword = changeLoginPassword;
exports.changeWithdrawlPassword = changeWithdrawlPassword;
