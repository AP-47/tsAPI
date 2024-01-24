import express, { Request, Response } from "express";
import mongoose, { Schema, Document } from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 8080;
const SECRET_KEY = "your-secret-key";

const DB_URL = "mongodb://127.0.0.1:27017/octa";

//Database connection configuration
mongoose.connect(DB_URL);
mongoose.connection;

app.use(bodyParser.json());
app.use(cors());

// MongoDB User Schema
interface IUser extends Document {
  username: string;
  password: string;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model<IUser>("User", UserSchema);

// MongoDB Product Schema
interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
}

const ProductSchema: Schema = new Schema({
  name: { type: String },
  description: { type: String },
  price: { type: Number },
});

const Product = mongoose.model<IProduct>("Product", ProductSchema);

// MongoDB Category Schema
interface ICategory extends Document {
  cname: string;
}

const CategorySchema: Schema = new Schema({
  cname: { type: String },
});

const Category = mongoose.model<ICategory>("Category", CategorySchema);

// MongoDB Commission Schema
interface ICommission extends Document {
  commissionPercentage: Number;
  active: Boolean;
}

const CommissionSchema: Schema = new Schema({
  productID: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  commissionPercentage: { type: Number },
  parentCategoryID: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  active: { type: Boolean, default: true },
});

const Commission = mongoose.model<ICommission>("Commission", CommissionSchema);

// MongoDB Review Schema
interface IReview extends Document {
  rating: Number;
  comment: String;
}

const ReviewSchema: Schema = new Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  rating: Number,
  comment: String,
});

const Review = mongoose.model<IReview>("Review", ReviewSchema);

// Login Route
app.post("/auth/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Validate username and password (add more robust validation as needed)

  const user = await User.findOne({ username, password }).exec();

  if (user) {
    const token = jwt.sign({ userId: user._id }, SECRET_KEY, {
      expiresIn: "1h",
    });
    return res.json({ token });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
});

// Logout Route
app.post("/auth/logout", (req: Request, res: Response) => {
  // You may want to implement more robust session handling
  return res.json({ message: "Logout successful" });
});

// Session Check Route
app.get("/auth/session", (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, SECRET_KEY, (err: any, decoded: any) => {
    if (err) {
      return res.status(401).json({ message: "Token expired or invalid" });
    }

    // Check permissions or other session-related information as needed
    return res.json({ userId: decoded.userId });
  });
});

app.get("/products", async (req: Request, res: Response) => {
  try {
    const products = await Product.find().exec();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add Product Route
app.post("/products", async (req: Request, res: Response) => {
  const { name, description, price } = req.body;

  try {
    const newProduct = await Product.create({ name, description, price });
    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update Product Route
app.put("/products/:id", async (req: Request, res: Response) => {
  const productId = req.params.id;
  const { name, description, price } = req.body;

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { name, description, price },
      { new: true }
    ).exec();

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete Product Route
app.delete("/products/:id", async (req: Request, res: Response) => {
  const productId = req.params.id;

  try {
    const deletedProduct = await Product.findByIdAndDelete(productId).exec();

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(deletedProduct);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/products/bulk-upload", async (req: Request, res: Response) => {
  const products = req.body;

  try {
    const newProducts = await Product.insertMany(products);
    res.json(newProducts);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get Categories Route
app.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().exec();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add Category Route
app.post("/categories", async (req: Request, res: Response) => {
  const { cname } = req.body;

  try {
    const newCategory = await Category.create({ cname });
    res.json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update Category Route
app.put("/categories/:id", async (req: Request, res: Response) => {
  const categoryId = req.params.id;
  const { cname } = req.body;

  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { cname },
      { new: true }
    ).exec();

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete Category Route
app.delete("/categories/:id", async (req: Request, res: Response) => {
  const categoryId = req.params.id;

  try {
    const deletedCategory = await Category.findByIdAndDelete(categoryId).exec();

    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json(deletedCategory);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get Commissions Route with Query Parameters
app.get("/commissions/products", async (req: Request, res: Response) => {
  const { name, id, category } = req.query;
  const query: any = {};

  if (name) query.name = new RegExp("i");
  if (id) query._id = id;
  if (category) query.parentCategoryID = category;

  try {
    const commissions = await Commission.find(query).exec();
    res.json(commissions);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add Commission Route
app.post("/commissions/products", async (req: Request, res: Response) => {
  const { productID, commissionPercentage, parentCategoryID } = req.body;

  try {
    const newCommission = await Commission.create({
      productID,
      commissionPercentage,
      parentCategoryID,
    });
    res.json(newCommission);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update Commission Route
app.put("/commissions/products/:id", async (req: Request, res: Response) => {
  const commissionId = req.params.id;
  const { commissionPercentage, parentCategoryID } = req.body;

  try {
    const updatedCommission = await Commission.findByIdAndUpdate(
      commissionId,
      { commissionPercentage, parentCategoryID },
      { new: true }
    ).exec();

    if (!updatedCommission) {
      return res.status(404).json({ message: "Commission setting not found" });
    }

    res.json(updatedCommission);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get Commission Details Route
app.get("/commissions/products/:id", async (req: Request, res: Response) => {
  const commissionId = req.params.id;

  try {
    const commission = await Commission.findById(commissionId).exec();

    if (!commission) {
      return res.status(404).json({ message: "Commission setting not found" });
    }

    res.json(commission);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete Commission Route
app.delete("/commissions/products/:id", async (req: Request, res: Response) => {
  const commissionId = req.params.id;

  try {
    const deletedCommission = await Commission.findByIdAndDelete(
      commissionId
    ).exec();

    if (!deletedCommission) {
      return res.status(404).json({ message: "Commission setting not found" });
    }

    res.json(deletedCommission);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get Parent Categories Route
app.get("/categories/parent", async (req: Request, res: Response) => {
  try {
    const parentCategories = await Category.find({
      parentCategoryID: null,
    }).exec();
    res.json(parentCategories);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add Parent Category Route
app.post("/categories/parent", async (req: Request, res: Response) => {
  const { name } = req.body;

  try {
    const newParentCategory = await Category.create({
      name,
      parentCategoryID: null,
    });
    res.json(newParentCategory);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update Parent Category Route
app.put("/categories/parent/:id", async (req: Request, res: Response) => {
  const parentCategoryId = req.params.id;
  const { name } = req.body;

  try {
    const updatedParentCategory = await Category.findByIdAndUpdate(
      parentCategoryId,
      { name },
      { new: true }
    ).exec();

    if (!updatedParentCategory) {
      return res.status(404).json({ message: "Parent category not found" });
    }

    res.json(updatedParentCategory);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete Parent Category Route
app.delete("/categories/parent/:id", async (req: Request, res: Response) => {
  const parentCategoryId = req.params.id;

  try {
    const deletedParentCategory = await Category.findByIdAndDelete(
      parentCategoryId
    ).exec();

    if (!deletedParentCategory) {
      return res.status(404).json({ message: "Parent category not found" });
    }

    res.json(deletedParentCategory);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get Commission History Route
app.get(
  "/commissions/products/:id/history",
  async (req: Request, res: Response) => {
    const commissionId = req.params.id;

    try {
      res.json({ message: "Commission history not implemented yet" });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Toggle Commission Status Route
app.patch(
  "/commissions/products/:id/status",
  async (req: Request, res: Response) => {
    const commissionId = req.params.id;

    try {
      const commission = await Commission.findById(commissionId).exec();

      if (!commission) {
        return res
          .status(404)
          .json({ message: "Commission setting not found" });
      }

      commission.active = !commission.active;
      await commission.save();

      res.json({
        message: "Commission status toggled successfully",
        commission,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Get Reviews Route
app.get("/reviews", async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find().exec();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Add Review Route
app.post("/reviews", async (req: Request, res: Response) => {
  const { productId, rating, comment } = req.body;

  try {
    const newReview = await Review.create({ productId, rating, comment });
    res.json(newReview);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Respond to Review Route
app.post("/reviews/respond", async (req: Request, res: Response) => {
  const { reviewId, response } = req.body;

  try {
    const review = await Review.findById(reviewId).exec();

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await review.save();

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
