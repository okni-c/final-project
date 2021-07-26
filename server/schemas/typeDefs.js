const { gql } = require('apollo-server-express');

const typeDefs = gql`
    type Category {
        _id: ID
        name: String
    }

    type Product {
        _id: ID
        name: String
        description: String
        thumbnail: String
        quantity: Int
        price: Float
        category: Category
        reviews: [Review]
        modelImage:String
    }

    type Order {
        _id: ID
        purchaseDate: String
        products: [Product]
    }

    type User {
        _id: ID
        firstName: String
        lastName: String
        email: String
        password: String
        orders: [Order]
    }

    type Checkout {
        session: ID
    }

    type Review {
        _id: ID
        productID: String
        author: String
        reviewText: String
    }

    type Auth {
        token: ID
        user: User
    }

    type Query {
        categories: [Category]
        products(category: ID, name: String): [Product]
        product(_id: ID!): Product
        user: User
        order(_id: ID!): Order
        checkout(products: [ID]!): Checkout
    }

    type Mutation {
        addUser(firstName: String!, lastName: String!, email: String!, password: String!): Auth
        addOrder(products: [ID]!): Order
        updateUser(firstName: String!, lastName: String!, email: String!, password: String!): User
        updateProduct(_id: ID!, quantity: Int!): Product
        updateProductReview(productID:ID!, author: String!, reviewText: String!): Product
        login(email: String!, password: String!): Auth
        addProduct(_id: ID!): Product
        removeProduct(_id: ID!): Product
        removeReview(_id: ID!): Product
    }
`

module.exports = typeDefs;
