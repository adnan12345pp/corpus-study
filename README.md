# Web Development Learning Checklist (MongoDB Synced)

This is a full-stack Node.js application that tracks your learning checklist progress. It can sync with MongoDB when configured, and it will automatically fall back to browser-local storage or in-memory storage when no database is available.

## How to run locally & deploy:

1. **Install Dependencies:**
   Run the following command in your project folder:
   ```bash
   npm install
   ```

2. **Configure MongoDB URI (Optional):**
   The server automatically loads `MONGO_URI` from a `.env` file in the project folder. You can also set it in the environment:
   ```bash
   export MONGO_URI="your_mongodb_atlas_connection_string"
   ```
   If you do not set it, the app still works using local browser storage and in-memory progress tracking. Changes are saved in the browser immediately and queued for server sync if the server is temporarily unavailable.

3. **Start the Server:**
   ```bash
   npm start
   ```
   Open `http://localhost:3000` in your browser.

4. **Deploy Online (Free):**
   You can deploy this folder to **Render**, **Railway**, or **Vercel**. The app will keep working even without a MongoDB connection, though the cloud-sync features will remain unavailable until a valid `MONGO_URI` is configured.
