/* =========================
   NADUFEMG FARM ADMIN
========================= */


let firebaseReady = false;


/* =========================
   WAIT FOR FIREBASE
========================= */

window.addEventListener(
  "adminFirebaseReady",
  function () {

    firebaseReady = true;

    setupAdmin();

  }
);


/* =========================
   SETUP ADMIN
========================= */

function setupAdmin() {

  const loginBtn =
    document.getElementById("loginBtn");

  const logoutBtn =
    document.getElementById("logoutBtn");


  loginBtn.addEventListener(
    "click",
    loginAdmin
  );


  logoutBtn.addEventListener(
    "click",
    logoutAdmin
  );


  window.firebaseOnAuthStateChanged(
    window.adminAuth,
    function (user) {

      if (user) {

        showDashboard();

        loadOrders();

        loadPendingReviews();

      } else {

        showLogin();

      }

    }
  );

}


/* =========================
   LOGIN
========================= */

async function loginAdmin() {

  const email =
    document.getElementById(
      "adminEmail"
    ).value.trim();


  const password =
    document.getElementById(
      "adminPassword"
    ).value;


  const errorBox =
    document.getElementById(
      "loginError"
    );


  errorBox.textContent = "";


  if (!email || !password) {

    errorBox.textContent =
      "Please enter your email and password.";

    return;

  }


  try {

    await window.firebaseSignIn(
      window.adminAuth,
      email,
      password
    );

  }

  catch (error) {
  console.error("Firebase login error:", error);

  const errorMessages = {
    "auth/invalid-credential":
      "Firebase rejected the email or password. Check both carefully.",

    "auth/wrong-password":
      "The password is incorrect. Try resetting it.",

    "auth/user-not-found":
      "No account was found with that email.",

    "auth/invalid-email":
      "The email address is not valid.",

    "auth/unauthorized-domain":
      "This website's domain is not authorized in Firebase.",

    "auth/network-request-failed":
      "Network error. Check your internet connection.",

    "auth/too-many-requests":
      "Too many attempts. Wait a while before trying again.",

    "auth/operation-not-allowed":
      "Email and password login is not enabled in Firebase."
  };

  const message =
    errorMessages[error.code] ||
    "Firebase error: " +
    (error.code || error.message || "Unknown error");

  errorBox.textContent = message;
}

}


/* =========================
   LOGOUT
========================= */

async function logoutAdmin() {

  try {

    await window.firebaseSignOut(
      window.adminAuth
    );

  }

  catch (error) {

    console.error(error);

  }

}


/* =========================
   SHOW LOGIN
========================= */

function showLogin() {

  document.getElementById(
    "loginBox"
  ).style.display = "block";


  document.getElementById(
    "dashboard"
  ).style.display = "none";

}


/* =========================
   SHOW DASHBOARD
========================= */

function showDashboard() {

  document.getElementById(
    "loginBox"
  ).style.display = "none";


  document.getElementById(
    "dashboard"
  ).style.display = "block";

}


/* =========================
   LOAD ORDERS
========================= */

async function loadOrders() {

  const container =
    document.getElementById(
      "ordersContainer"
    );


  try {

    const snapshot =
      await window.firebaseGetDocs(
        window.firebaseCollection(
          window.adminDB,
          "orders"
        )
      );


    container.innerHTML = "";


    document.getElementById(
      "totalOrders"
    ).textContent = snapshot.size;


    let newCount = 0;

    let deliveredCount = 0;


    if (snapshot.empty) {

      container.innerHTML =
        '<div class="message">No orders yet.</div>';

      document.getElementById(
        "newOrders"
      ).textContent = "0";

      document.getElementById(
        "deliveredOrders"
      ).textContent = "0";

      return;

    }


    snapshot.forEach(
      function(orderDoc) {

        const order =
          orderDoc.data();


        const orderId =
          orderDoc.id;


        if (
          order.status === "new"
        ) {

          newCount++;

        }


        if (
          order.status === "delivered"
        ) {

          deliveredCount++;

        }


        const card =
          document.createElement(
            "div"
          );


        card.className =
          "order-card";


        card.innerHTML = `

          <h3>
            ${order.product || "Product"}
          </h3>

          <p>
            <strong>Customer:</strong>
            ${order.name || ""}
          </p>

          <p>
            <strong>Phone:</strong>
            ${order.phone || ""}
          </p>

          <p>
            <strong>Quantity:</strong>
            ${order.quantity || ""}
          </p>

          <p>
            <strong>Delivery:</strong>
            ${order.delivery || ""}
          </p>

          <p>
            <strong>Location:</strong>
            ${order.location || ""}
          </p>

          <p>
            <strong>Message:</strong>
            ${order.message || "None"}
          </p>

          <p>
            <strong>Status:</strong>
            <span class="status">
              ${order.status || "new"}
            </span>
          </p>

          <div class="actions">

            <button
              class="status-btn"
              onclick="changeOrderStatus('${orderId}', 'confirmed')"
            >
              Confirmed
            </button>

            <button
              class="status-btn"
              onclick="changeOrderStatus('${orderId}', 'delivered')"
            >
              Delivered
            </button>

          </div>

        `;


        container.appendChild(card);

      }
    );


    document.getElementById(
      "newOrders"
    ).textContent = newCount;


    document.getElementById(
      "deliveredOrders"
    ).textContent =
      deliveredCount;

  }

  catch (error) {

    console.error(error);

    container.innerHTML =
      '<div class="message">Unable to load orders. Check your Firebase rules.</div>';

  }

}


/* =========================
   CHANGE ORDER STATUS
========================= */

async function changeOrderStatus(
  orderId,
  newStatus
) {

  try {

    await window.firebaseUpdateDoc(

      window.firebaseDoc(
        window.adminDB,
        "orders",
        orderId
      ),

      {
        status: newStatus
      }

    );


    alert(
      "Order status updated successfully."
    );


    loadOrders();

  }

  catch (error) {

    console.error(error);

    alert(
      "Unable to update order status."
    );

  }

}


/* =========================
   LOAD PENDING REVIEWS
========================= */

async function loadPendingReviews() {

  const container =
    document.getElementById(
      "pendingReviewsContainer"
    );


  try {

    const reviewsQuery =
      window.firebaseQuery(

        window.firebaseCollection(
          window.adminDB,
          "reviews"
        ),

        window.firebaseWhere(
          "approved",
          "==",
          false
        )

      );


    const snapshot =
      await window.firebaseGetDocs(
        reviewsQuery
      );


    container.innerHTML = "";


    document.getElementById(
      "pendingReviews"
    ).textContent =
      snapshot.size;


    if (snapshot.empty) {

      container.innerHTML =
        '<div class="message">No reviews waiting for approval.</div>';

      return;

    }


    snapshot.forEach(
      function(reviewDoc) {

        const review =
          reviewDoc.data();


        const reviewId =
          reviewDoc.id;


        const card =
          document.createElement(
            "div"
          );


        card.className =
          "review-card";


        card.innerHTML = `

          <div class="stars">
            ${"⭐".repeat(
              Number(review.rating || 0)
            )}
          </div>

          <p>
            <strong>Name:</strong>
            ${review.name || ""}
          </p>

          <p>
            <strong>Product:</strong>
            ${review.product || ""}
          </p>

          <p>
            <strong>Comment:</strong>
            ${review.comment || ""}
          </p>

          <div class="actions">

            <button
              class="approve"
              onclick="approveReview('${reviewId}')"
            >
              Approve
            </button>

            <button
              class="reject"
              onclick="rejectReview('${reviewId}')"
            >
              Reject
            </button>

          </div>

        `;


        container.appendChild(card);

      }
    );

  }

  catch (error) {

    console.error(error);

    container.innerHTML =
      '<div class="message">Unable to load reviews. Check your Firebase rules.</div>';

  }

}


/* =========================
   APPROVE REVIEW
========================= */

async function approveReview(
  reviewId
) {

  try {

    await window.firebaseUpdateDoc(

      window.firebaseDoc(
        window.adminDB,
        "reviews",
        reviewId
      ),

      {
        approved: true,
        status: "approved"
      }

    );


    alert(
      "Review approved successfully."
    );


    loadPendingReviews();

  }

  catch (error) {

    console.error(error);

    alert(
      "Unable to approve review."
    );

  }

}


/* =========================
   REJECT REVIEW
========================= */

async function rejectReview(
  reviewId
) {

  try {

    await window.firebaseUpdateDoc(

      window.firebaseDoc(
        window.adminDB,
        "reviews",
        reviewId
      ),

      {
        approved: false,
        status: "rejected"
      }

    );


    alert(
      "Review rejected."
    );


    loadPendingReviews();

  }

  catch (error) {

    console.error(error);

    alert(
      "Unable to reject review."
    );

  }

}