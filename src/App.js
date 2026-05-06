import Register from "./components/Register";
import ipConfig from "./ipConfig.json";
import { Route, Switch } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Login from "./components/Login";
import Products from "./components/Products";
import Checkout from "./components/Checkout";
import Thanks from "./components/Thanks";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Orders from "./components/Orders";
import SellerDashboard from "./components/SellerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { useEffect } from "react";
import axios from "axios";
import WalletTopup from "./components/WalletTopup";

// export const config = {
//   endpoint: `https://qkart-g8o2.onrender.com/api/v1`,
// };

export const config = {
  endpoint: `${ipConfig.workspaceIp}/api/v1`,
};

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

function App() {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    axios
      .get(`${config.endpoint}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        localStorage.setItem("isSeller", res.data.isSeller);
        localStorage.setItem("isAdmin", res.data.isAdmin);
        localStorage.setItem("adminPriority", res.data.adminPriority || "");
      })
      .catch(() => {
        // token expired or invalid — clear storage
        localStorage.clear();
      });
  }, []);
  
  return (
    <div className="App">
      <Elements stripe={stripePromise}>
        <Switch>
          <Route path="/thanks" component={Thanks} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/register" component={Register} />
          <Route path="/login" component={Login} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/orders" component={Orders} />
          <Route path="/seller" component={SellerDashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/wallet" component={WalletTopup} />
          <Route path="/" component={Products} />
        </Switch>
      </Elements>
    </div>
  );
}

export default App;
