import * as service from './auth.service.js';

export function adminLogin(req, res, next) {
  try {
    res.json(service.adminLogin(req.validated));
  } catch (err) {
    next(err);
  }
}

export function tableLogin(req, res, next) {
  try {
    res.json(service.tableLogin(req.validated));
  } catch (err) {
    next(err);
  }
}
