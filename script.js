
/* =========================================================
   SELECT PRODUCT
   ======================================================== */

function selectProduct(productName) {

  const productSelect =
    document.getElementById("product");

  if (productSelect) {
    productSelect.value = productName;
  }

  const orderSection =
    document.getElementById("order");

  if (orderSection) {
    orderSection.scrollIntoView({
      behavior: "smooth"
    });
  }
}


/* =========================================================
   STAR RATING
   ========================================================= */

function setupStarRating() {

  const stars =
    document.querySelectorAll(
      ".stars-input button"
    );

  const ratingInput =
    document.getElementById("rating");

  if (!ratingInput || !stars.length) {
    return;
  }

  stars.forEach(function(star) {

    star.addEventListener(
      "click",
      function() {

        const rating =
          Number(
            star.getAttribute("data-rating")
          );

        ratingInput.value = rating;

        stars.forEach(function(item) {
          item.classList.remove("active");
        });

        for (let i = 0; i < rating; i++) {
          stars[i].classList.add("active");
        }

      }
    );

  });

}


/* =========================================================
   ORDER / ADVANCE BOOKING FORM
   The complete handler is defined below.
   ========================================================= */


/* =========================
   ORDER / ADVANCE BOOKING
========================= */

const orderForm = document.getElementById("orderForm");
const productInput = document.getElementById("product");
const ageTypeInput = document.getElementById("ageType");
const quantityUnitInput = document.getElementById("quantityUnit");
const orderTypeInput = document.getElementById("orderType");
const preferredDateInput = document.getElementById("preferredDate");
const deliveryInput = document.getElementById("delivery");
const locationInput = document.getElementById("location");
const submitOrderButton = document.getElementById("submitOrderButton");

const productChoices = {
  "Chicken": {
    ages: ["Day-old", "1 week", "2 weeks", "3–4 weeks", "Older chicken — specify in notes"],
    units: ["Birds"]
  },
  "Turkey": {
    ages: ["Day-old", "1 week", "2 weeks", "3–4 weeks", "Older turkey — specify in notes"],
    units: ["Birds"]
  },
  "Day-old chicks": {
    ages: ["Day-old"],
    units: ["Birds"]
  },
  "Poults": {
    ages: ["Day-old", "1 week", "2 weeks", "3–4 weeks", "Older poult — specify in notes"],
    units: ["Birds"]
  },
  "Eggs": {
    ages: ["Fresh eggs for eating", "Fertile eggs for hatching"],
    units: ["Crates", "Pieces"]
  },
  "Catfish": {
    ages: ["Fingerlings", "Juveniles", "Table-size fish", "Specify size in notes"],
    units: ["Fish", "Kilograms"]
  }
};

function fillSelect(select, values, placeholder) {
  select.innerHTML = "";

  const first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.appendChild(first);

  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  if (values.length === 1) {
    select.value = values[0];
  }
}

function updateProductOptions() {
  const selected = productChoices[productInput.value];

  if (!selected) {
    fillSelect(ageTypeInput, [], "Choose a product first");
    fillSelect(quantityUnitInput, ["Birds"], "Choose unit");
    return;
  }

  fillSelect(ageTypeInput, selected.ages, "Select age / size / type");
  fillSelect(quantityUnitInput, selected.units, "Select quantity unit");

  document.getElementById("ageTypeHelp").textContent =
    productInput.value === "Eggs"
      ? "Choose fresh eggs or fertile eggs for hatching."
      : productInput.value === "Catfish"
      ? "Choose the fish growth stage or specify size in the notes."
      : "Choose the age of the birds you want.";
}

productInput.addEventListener("change", updateProductOptions);

orderTypeInput.addEventListener("change", function () {
  const booking = orderTypeInput.value === "booking";

  preferredDateInput.required = booking;

  document.getElementById("dateHelp").textContent = booking
    ? "Choose a preferred date. This request is not confirmed until the farm approves it."
    : "Optional for orders. For advance bookings, choose a preferred date.";

  submitOrderButton.textContent = booking
    ? "Send Booking Request"
    : "Submit Order";
});

deliveryInput.addEventListener("change", function () {
  locationInput.required = deliveryInput.value === "Delivery";

  locationInput.placeholder = deliveryInput.value === "Pickup"
    ? "Optional: town/city for pickup coordination"
    : "Area, town/city and delivery address";
});

updateProductOptions();

orderForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const product = productInput.value;
  const ageType = ageTypeInput.value;
  const quantity = Number(document.getElementById("quantity").value);
  const quantityUnit = quantityUnitInput.value;
  const orderType = orderTypeInput.value;
  const preferredDate = preferredDateInput.value;
  const delivery = deliveryInput.value;
  const location = locationInput.value.trim();
  const message = document.getElementById("message").value.trim();
  const isBooking = orderType === "booking";

  if (!Number.isInteger(quantity) || quantity < 1) {
    alert("Please enter a quantity of at least 1.");
    return;
  }

  if (!product || !ageType || !quantityUnit) {
    alert("Please select a product, age/type and quantity unit.");
    return;
  }

  if (delivery === "Delivery" && !location) {
    alert("Please enter the delivery location.");
    locationInput.focus();
    return;
  }

  if (isBooking && !preferredDate) {
    alert("Please choose your preferred date for the advance booking.");
    preferredDateInput.focus();
    return;
  }

  submitOrderButton.disabled = true;
  submitOrderButton.textContent = "Submitting...";

  try {
    if (!window.firebaseDB || !window.firebaseAddDoc) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(
            "Firebase did not finish loading. Check your internet connection and Firebase setup."
          ));
        }, 12000);

        window.addEventListener("firebaseReady", () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
      });
    }

    const orderData = {
      name,
      phone,
      product,
      ageType,
      quantity,
      quantityUnit,
      orderType: isBooking ? "booking" : "order",
      preferredDate: preferredDate || "",
      delivery,
      location,
      message,
      status: isBooking ? "pending" : "new",
      createdAt: window.firebaseServerTimestamp()
    };

    const savedOrder = await window.firebaseAddDoc(
      window.firebaseCollection(window.firebaseDB, "orders"),
      orderData
    );

    // Save the order or booking to Firebase
const savedOrder = await window.firebaseAddDoc(
  window.firebaseCollection(window.firebaseDB, "orders"),
  orderData
);

// Prepare the email notification
const emailParams = {
  order_id: savedOrder.id,
  order_type: isBooking ? "Booking Request" : "New Order",
  name: name,
  phone: phone,
  product: product,
  age_type: ageType,
  quantity: `${quantity} ${quantityUnit}`,
  preferred_date: preferredDate || "Not specified",
  delivery: delivery,
  location: location || "Not provided",
  message: message || "None"
};

// Send email notification using EmailJS
try {
  if (
    window.emailjs &&
    window.NADUFEMG_EMAILJS_CONFIG
  ) {
    await window.emailjs.send(
      window.NADUFEMG_EMAILJS_CONFIG.service_j0jr6x9,
      window.NADUFEMG_EMAILJS_CONFIG.template_7ersxva,
      emailParams
    );

    console.log("Email notification sent successfully.");
  } else {
    console.error("EmailJS configuration is missing.");
  }
} catch (emailError) {
  console.error("Email notification failed:", emailError);
}

// Inform the customer
alert(
  isBooking
    ? "Your booking request has been saved. NADUFEMG FARM will contact you to confirm availability."
    : "Your order has been saved. NADUFEMG FARM will contact you to confirm the details."
);

// Reset the form
orderForm.reset();
updateProductOptions();
orderTypeInput.dispatchEvent(new Event("change"));
deliveryInput.dispatchEvent(new Event("change"));

    orderForm.reset();
    updateProductOptions();
    orderTypeInput.dispatchEvent(new Event("change"));
    deliveryInput.dispatchEvent(new Event("change"));

  } catch (error) {
    console.error("Order/booking error:", error);

    alert(
      "Sorry, your order or booking could not be saved. Please check your connection and try again.\n\nDetails: " +
      error.message
    );

  } finally {
    submitOrderButton.disabled = false;
    submitOrderButton.textContent =
      orderTypeInput.value === "booking"
        ? "Send Booking Request"
        : "Submit Order";
  }
});


/* =========================================================
   REVIEW FORM
   ========================================================= */

function setupReviewForm() {

  const reviewForm =
    document.getElementById(
      "reviewForm"
    );

  if (!reviewForm) {
    return;
  }


  reviewForm.addEventListener(
    "submit",
    async function(event) {

      event.preventDefault();


      const name =
        document.getElementById(
          "reviewName"
        ).value.trim();


      const product =
        document.getElementById(
          "reviewProduct"
        ).value;


      const rating =
        document.getElementById(
          "rating"
        ).value;


      const comment =
        document.getElementById(
          "reviewComment"
        ).value.trim();


      /* CHECK RATING */

      if (!rating) {

        alert(
          "Please select a rating ⭐"
        );

        return;
      }


      /* CHECK FIREBASE */

      if (
        !window.firebaseDB ||
        !window.firebaseAddDoc ||
        !window.firebaseCollection
      ) {

        alert(
          "The website is still connecting to Firebase. Please wait a moment and try again."
        );

        return;
      }


      try {

        /* SAVE REVIEW TO FIRESTORE */

        await window.firebaseAddDoc(

          window.firebaseCollection(
            window.firebaseDB,
            "reviews"
          ),

          {
            name: name,
            product: product,
            rating: Number(rating),
            comment: comment,

            /* REVIEW MUST BE APPROVED BY ADMIN */

            approved: false,

            status: "pending",

            createdAt:
              window.firebaseServerTimestamp()
          }

        );


        alert(
          "Thank you for your review! ⭐❤️\n\nYour review has been submitted and is waiting for approval."
        );


        reviewForm.reset();


        /* RESET STAR DISPLAY */

        const stars =
          document.querySelectorAll(
            ".stars-input button"
          );

        stars.forEach(function(star) {

          star.classList.remove(
            "active"
          );

        });


        const ratingInput =
          document.getElementById(
            "rating"
          );

        if (ratingInput) {
          ratingInput.value = "";
        }


      } catch (error) {

        console.error(
          "Review error:",
          error
        );


        alert(
          "Sorry, your review could not be submitted. Please try again."
        );

      }

    }
  );

}


/* =========================================================
   LOAD APPROVED REVIEWS
   ========================================================= */

async function loadApprovedReviews() {

  const reviewsContainer =
    document.getElementById(
      "reviewsContainer"
    );


  if (!reviewsContainer) {
    return;
  }


  /* CHECK FIREBASE */

  if (
    !window.firebaseDB ||
    !window.firebaseGetDocs ||
    !window.firebaseCollection ||
    !window.firebaseQuery ||
    !window.firebaseWhere
  ) {

    reviewsContainer.innerHTML = `
      <div class="review-card">
        <p>Loading customer reviews...</p>
      </div>
    `;

    return;
  }


  try {

    console.log(
      "Loading approved reviews..."
    );


    const reviewsQuery =
      window.firebaseQuery(

        window.firebaseCollection(
          window.firebaseDB,
          "reviews"
        ),

        window.firebaseWhere(
          "approved",
          "==",
          true
        )

      );


    const reviewsSnapshot =
      await window.firebaseGetDocs(
        reviewsQuery
      );


    console.log(
      "Number of approved reviews:",
      reviewsSnapshot.size
    );


    /* CLEAR ORIGINAL PLACEHOLDER */

    reviewsContainer.innerHTML = "";


    /* NO APPROVED REVIEWS */

    if (reviewsSnapshot.empty) {

      reviewsContainer.innerHTML = `

        <div class="review-card">

          <div class="stars">
            ⭐⭐⭐⭐⭐
          </div>

          <p>
            No approved customer reviews yet.
          </p>

          <strong>
            NADUFEMG FARM
          </strong>

        </div>

      `;

      return;
    }


    /* DISPLAY APPROVED REVIEWS */

    reviewsSnapshot.forEach(function(documentSnapshot) {

  const review = documentSnapshot.data();

  const reviewCard = document.createElement("div");
  reviewCard.className = "review-card";

  const starsElement = document.createElement("div");
  starsElement.className = "stars";
  starsElement.textContent = "⭐".repeat(
    Math.max(0, Math.min(5, Number(review.rating) || 0))
  );

  const commentElement = document.createElement("p");
  commentElement.textContent = String(review.comment || "");

  const nameElement = document.createElement("strong");
  nameElement.textContent = String(review.name || "Customer");

  const productElement = document.createElement("p");
  productElement.textContent =
    "Purchased: " + String(review.product || "Not specified");

  reviewCard.appendChild(starsElement);
  reviewCard.appendChild(commentElement);
  reviewCard.appendChild(nameElement);
  reviewCard.appendChild(productElement);

  reviewsContainer.appendChild(reviewCard);

});


  } catch (error) {

    console.error(
      "Review loading error:",
      error
    );


        reviewsContainer.innerHTML = "";

    const errorCard = document.createElement("div");
    errorCard.className = "review-card";

    const errorTitle = document.createElement("p");
    errorTitle.textContent = "Unable to load reviews.";

    const errorMessage = document.createElement("p");
    errorMessage.textContent =
      "Please check your internet connection and try again.";

    errorCard.appendChild(errorTitle);
    errorCard.appendChild(errorMessage);

    reviewsContainer.appendChild(errorCard);
  }

}


/* =========================================================
   INITIALIZE WEBSITE
   ========================================================= */

function initializeWebsite() {

  console.log(
    "NADUFEMG FARM script.js is running."
  );


  setupStarRating();

  setupReviewForm();


  /*

     Firebase is loaded by the module
     inside index.html.

     If Firebase is already ready,
     load reviews immediately.

     Otherwise wait for the
     firebaseReady event.
  */

  if (window.firebaseDB) {

    loadApprovedReviews();

  } else {

    window.addEventListener(
      "firebaseReady",
      function() {

        console.log(
          "Firebase is ready."
        );

        loadApprovedReviews();

      },
      { once: true }
    );

  }

}


/* =========================================================
   START WEBSITE
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeWebsite
  );

} else {

  initializeWebsite();

}
