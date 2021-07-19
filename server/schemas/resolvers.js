const { AuthenticationError } = require("apollo-server-express");
const { User, Category, Product, Order, Review } = require("../models");
const { signToken } = require("../utils/auth");
const { STRIPE_URI } = require("../.env");
const stripe = require("stripe")
console.log(STRIPE_URI);

const resolvers = {
  Query: {
    categories: async () => {
      return await Category.find();
    },
    products: async (parent, { category, name }) => {
      const params = {};

      if (category) {
        params.category = category;
      }

      if (name) {
        params.name = {
          $regex: name,
        };
      }
      return await Product.find(params).populate("category");
    },
    product: async (parent, { _id }) => {
      return await Product.findOne({ _id });
    },
    order: async (parent, { _id }, context) => {
      if (context.user) {
        const user = await User.findById(context.user._id).populate({
          path: "orders.products",
          populate: "category",
        });

        return user.orders.id(_id);
      }

      throw new AuthenticationError("Not logged in");
    },
    user: async (parent, args, context) => {
      if (context.user) {
        const user = await User.findById(context.user._id).populate({
          path: "orders.products",
          populate: "category",
        });

        user.orders.sort((a, b) => b.purchaseDate - a.purchaseDate);

        return user;
      }

      throw new AuthenticationError("Not logged in");
    },
    checkout: async (parent, args, context) => {
      const url = new URL(context.headers.referer).origin;
      const order = new Order({ products: args.products });
      const line_items = [];

      const { products } = await order.populate("products").execPopulate();

      for (let i = 0; i < products.length; i++) {
        const product = await stripe.products.create({
          name: products[i].name,
          description: products[i].description,
          images: [`${url}/images/${products[i].thumbnail}`],
        });

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: products[i].price * 100,
          currency: "usd",
        });

        line_items.push({
          price: price.id,
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        success_url: `${url}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${url}/`,
      });

      return { session: session.id };
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);

      return { token, user };
    },
    addOrder: async (parent, { products }, context) => {
      if (context.user) {
        const order = new Order({ products });

        await User.findByIdAndUpdate(context.user._id, {
          $push: { orders: order },
        });
        return order;
      }
      throw new AuthenticationError("Not logged in.");
    },
    updateUser: async (parent, args, context) => {
      if (context.user) {
        return await User.findByIdAndUpdate(context.user._id, args, {
          new: true,
        });
      }
      throw new AuthenticationError("Not logged in");
    },
    updateProduct: async (parent, { _id, quantity }) => {
      const decrement = Math.abs(quantity) * -1;

      return await Product.findByIdAndUpdate(
        _id,
        { $inc: { quantity: decrement } },
        { new: true }
      );
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email: email });
      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }
      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);

      return { token, user };
    },
    addReview: async (parent, args, context) => {
      if (context.user) {
        const fullName = context.user.firstName + ' ' + context.user.lastName;
          // maybe create({...args, context.user._id}) 
        // const { review } = await Review.create(args);
        //in theory...
        const review = await Review.create({...args, author: fullName });
          const product = await Product.findByIdAndUpdate(
            
            review.product._id,
            {
              $push: { reviews: review },
              new: true
            }
          );
        return product;
      }
    },
    addProduct: async (parent, args, context) => {
      if (context.user) {
        const product = await Product.create(args);
        return product;
      }
      throw new AuthenticationError("Incorrect credentials");
    },
    removeProduct: async (parent, { _id }, context) => {
      if (context.user) {
        const product = await Product.findByIdAndDelete({ _id: _id });
        return product;
      }
      throw new AuthenticationError("Incorrect credentials");
    },
    removeReview: async (parent, { _id }, context) => {
      if (context.user) {
        const review = await Review.findByIdAndDelete({ _id: _id });
        return review;
      }
      throw new AuthenticationError("Incorrect credentials");
    }
  },
};

module.exports = resolvers;