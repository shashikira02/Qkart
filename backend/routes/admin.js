const express = require("express");
const router = express.Router();
const { handleError, verifyAdmin } = require("../utils");
var { users, products } = require("../db");


router.get("/stats", verifyAdmin, (req, res) => {
  users.count({}, (err, totalUsers) => {
    if (err) return handleError(res, err);
    products.find({}, (err, allProducts) => {
      if (err) return handleError(res, err);

      const totalProducts = allProducts.length;
      const totalRevenue = allProducts.reduce((sum, p) => sum + (p.revenue || 0), 0);

      users.find({}, (err, allUsers) => {
        if (err) return handleError(res, err);
        const totalOrders = allUsers.reduce((sum, u) => sum + (u.orders || []).length, 0);

        return res.status(200).json({
          success: true,
          stats: { totalUsers, totalProducts, totalOrders, totalRevenue },
        });
      });
    });
  });
});


router.get('/users', verifyAdmin, (req, res)=>{
    users.find({}, (err, allUsers)=>{
        if(err)return handleError(res, err);
        const safeUsers = allUsers.map(({password, ...rest})=> rest)
        return res.status(200).json(safeUsers)
    })
})

router.get("/orders", verifyAdmin, (req, res) => {
  users.find({}, (err, allUsers) => {
    if (err) return handleError(res, err);
    const allOrders = allUsers.flatMap((u) =>
      (u.orders || []).map((o) => ({ ...o, username: u.username })),
    );
    allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.status(200).json(allOrders);
  });
});

router.patch("/users/:id/promote-seller", verifyAdmin, (req, res) => {
  users.update(
    { _id: req.params.id },
    { $set: { isSeller: req.body.isSeller } },
    {},
    (err, count) => {
      if (err) return handleError(res, err);
      if (count === 0)
        return res.status(404).json({ success: false, message: "User not found" });
      return res.status(200).json({ success: true });
    }
  );
});

router.patch("/users/:id/promote-admin", verifyAdmin, (req, res) => {
  if (req.user._id === req.params.id && req.body.isAdmin === false)
    return res.status(400).json({ success: false, message: "You cannot remove your own admin access" });

  users.findOne({ _id: req.params.id }, (err, targetUser) => {
    if (err) return handleError(res, err);
    if (!targetUser)
      return res.status(404).json({ success: false, message: "User not found" });

    if (req.body.isAdmin === false) {
      users.count({ isAdmin: true }, (err, adminCount) => {
        if (err) return handleError(res, err);
        if (adminCount <= 1)
          return res.status(400).json({ success: false, message: "Cannot remove the last admin" });

        if (targetUser.adminPriority && req.user.adminPriority >= targetUser.adminPriority)
          return res.status(403).json({ success: false, message: "You can only remove admins with lower priority than yours" });

        users.update(
          { _id: req.params.id },
          { $set: { isAdmin: false, adminPriority: null } },
          {},
          (err, count) => {
            if (err) return handleError(res, err);
            if (count === 0)
              return res.status(404).json({ success: false, message: "User not found" });
            return res.status(200).json({ success: true });
          }
        );
      });
    } else {
      users.find({ isAdmin: true }, (err, admins) => {
        if (err) return handleError(res, err);
        const maxPriority = admins.reduce((max, a) => Math.max(max, a.adminPriority || 0), 0);
        users.update(
          { _id: req.params.id },
          { $set: { isAdmin: true, adminPriority: maxPriority + 1 } },
          {},
          (err, count) => {
            if (err) return handleError(res, err);
            if (count === 0)
              return res.status(404).json({ success: false, message: "User not found" });
            return res.status(200).json({ success: true });
          }
        );
      });
    }
  });
});

module.exports = router;