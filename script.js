/* =========================================================
   NADUFEMG FARM
   Complete Website JavaScript
   Firebase Orders, Bookings, EmailJS and Reviews
   ========================================================= */


/* =========================================================
   SELECT PRODUCT
   ========================================================= */

function selectProduct(productName) {
  const productSelect = document.getElementById("product");

  if (productSelect) {
    productSelect.value = productName;
    productSelect.dispatchEvent(new Event("change"));
  }

  const orderSection = document.getElementById("order");

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
  const stars = document.querySelectorAll(".stars-input button");
  const ratingInput = document.getElementById("rating");

  if (!ratingInput || !stars.length) {
    return;
  }

  stars.forEach(function (star) {
    star.addEventListener("click", function () {
      const rating = Number(star.getAttribute("data-rating"));

      ratingInput.value = rating;

      stars.forEach(function (item) {
        item.classList.remove("active");
      });

      stars.forEach(function (item) {
        const itemRating = Number(item.getAttribute("data-rating"));

        if (itemRating <= rating) {
          item.classList.add("active");
        }
      });
    });
  });
}


/* =========================================================
   WAIT FOR FIREBASE
   ========================================================= */

function waitForFirebase(timeoutMilliseconds = 15000) {
  return new Promise(function (resolve, reject) {
    if (
      window.firebaseDB &&
      window.firebaseCollection &&
      window.firebaseAddDoc &&
      window.firebaseServerTimestamp
    ) {
      resolve();
      return;
    }

    let finished = false;

    const timeout = setTimeout(function () {
      if (finished) return;

      finished = true;

      reject(
        new Error(
          "Firebase did not finish loading. Check your internet connection and Firebase setup."
        )
      );
    }, timeoutMilliseconds);

    window.addEventListener(
      "firebaseReady",
      function () {
        if (finished) return;

        finished = true;
        clearTimeout(timeout);
        resolve();
      },
      { once: true }
    );
  });
}


/* =========================================================
   PRODUCT OPTIONS
   ========================================================= */

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
    ages: [
      "Day-old",
      "1 week",
      "2 weeks",
      "3–4 weeks",
      "Older chicken — specify in notes"
    ],
    units: ["Birds"]
  },

  "Turkey": {
    ages: [
      "Day-old",
      "1 week",
      "2 weeks",
      "3–4 weeks",
      "Older turkey — specify in notes"
    ],
    units: ["Birds"]
  },

  "Day-old chicks": {
    ages: ["Day-old"],
    units: ["Birds"]
  },

  "Poults": {
    ages: [
      "Day-old",
      "1 week",
      "2 weeks",
      "3–4 weeks",
      "Older poult — specify in notes"
    ],
    units: ["Birds"]
  },

  "Eggs": {
    ages: [
      "Fresh eggs for eating",
      "Fertile eggs for hatching"
    ],
    units: ["Crates", "Pieces"]
  },

  "Catfish": {
    ages: [
      "Fingerlings",
      "Juveniles",
      "Table-size fish",
      "Specify size in notes"
    ],
    units: ["Fish", "Kilograms"]
  }
};


/* =========================================================
   FILL DROPDOWN
   ========================================================= */

function fillSelect(select, values, placeholder) {
  if (!select) return;

  select.innerHTML = "";

  const firstOption = document.createElement("option");

  firstOption.value = "";
  firstOption.textContent = placeholder;

  select.appendChild(firstOption);

  values.forEach(function (value) {
    const option = document.createElement("option");

    option.value = value;
    option.textContent = value;

    select.appendChild(option);
  });

  if (values.length === 1) {
    select.value = values[0];
  }
}


/* =========================================================
   UPDATE PRODUCT OPTIONS
   ========================================================= */

function updateProductOptions() {
  if (!productInput || !ageTypeInput || !quantityUnitInput) {
    return;
  }

  const selected = productChoices[productInput.value];

  if (!selected) {
    fillSelect(
      ageTypeInput,
      [],
      "Choose a product first"
    );

    fillSelect(
      quantityUnitInput,
      ["Birds"],
      "Choose unit"
    );

    return;
  }

  fillSelect(
    ageTypeInput,
    selected.ages,
    "Select age / size / type"
  );

  fillSelect(
    quantityUnitInput,
    selected.units,
    "Select quantity unit"
  );

  const help = document.getElementById("ageTypeHelp");

  if (help) {
    if (productInput.value === "Eggs") {
      help.textContent =
        "Choose fresh eggs or fertile eggs for hatching.";
    } else if (productInput.value === "Catfish") {
      help.textContent =
        "Choose the fish growth stage or specify size in the notes.";
    } else {
      help.textContent =
        "Choose the age of the birds you want.";
    }
  }
}


/* =========================================================
   ORDER TYPE SETTINGS
   ========================================================= */

function updateOrderTypeSettings() {
  if (
    !orderTypeInput ||
    !preferredDateInput ||
    !submitOrderButton
  ) {
    return;
  }

  const isBooking = orderTypeInput.value === "booking";

  preferredDateInput.required = isBooking;

  const dateHelp = document.getElementById("dateHelp");

  if (dateHelp) {
    dateHelp.textContent = isBooking
      ? "Choose a preferred date. The farm must confirm your booking."
      : "Optional for orders. For advance bookings, choose your preferred date.";
  }

  submitOrderButton.textContent = isBooking
    ? "Send Booking Request"
    : "Submit Order";
}


/* =========================================================
   DELIVERY SETTINGS
   ========================================================= */

function updateDeliverySettings() {
  if (!deliveryInput || !locationInput) {
    return;
  }

  locationInput.required = deliveryInput.value === "Delivery";

  locationInput.placeholder =
    deliveryInput.value === "Pickup"
      ? "Optional: town/city for pickup coordination"
      : "Area, town/city and delivery address";
}


/* =========================================================
   EMAILJS ORDER NOTIFICATION
   ========================================================= */

async function sendOrderEmail(emailParams) {
  const emailConfig = window.NADUFEMG_EMAILJS_CONFIG;

  if (
    !window.emailjs ||
    !emailConfig ||
    !emailConfig.serviceID ||
    !emailConfig.templateID
  ) {
    console.error(
      "EmailJS is unavailable or its configuration is incomplete."
    );

    return {
      success: false,
      reason: "EmailJS is not configured correctly."
    };
  }

  try {
    const response = await window.emailjs.send(
      emailConfig.serviceID,
      emailConfig.templateID,
      emailParams
    );

    console.log(
      "Email notification sent successfully.",
      response.status
    );

    return {
      success: true
    };
  } catch (error) {
    console.error(
      "Email notification failed:",
      error
    );

    return {
      success: false,
      reason: error.message || "Email sending failed."
    };
  }
}


/* =========================================================
   ORDER / ADVANCE BOOKING FORM
   ========================================================= */

const orderForm = document.getElementById("orderForm");


if (productInput) {
  productInput.addEventListener(
    "change",
    updateProductOptions
  );
}

if (orderTypeInput) {
  orderTypeInput.addEventListener(
    "change",
    updateOrderTypeSettings
  );
}

if (deliveryInput) {
  deliveryInput.addEventListener(
    "change",
    updateDeliverySettings
  );
}

updateProductOptions();
updateOrderTypeSettings();
updateDeliverySettings();


if (orderForm) {
  orderForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const name =
        document.getElementById("customerName").value.trim();

      const phone =
        document.getElementById("phone").value.trim();

      const product = productInput.value;

      const ageType = ageTypeInput.value;

      const quantity =
        Number(document.getElementById("quantity").value);

      const quantityUnit = quantityUnitInput.value;

      const orderType = orderTypeInput.value;

      const preferredDate = preferredDateInput.value;

      const delivery = deliveryInput.value;

      const location = locationInput.value.trim();

      const message =
        document.getElementById("message").value.trim();

      const isBooking = orderType === "booking";


      /* VALIDATE QUANTITY */

      if (!Number.isInteger(quantity) || quantity < 1) {
        alert("Please enter a quantity of at least 1.");
        return;
      }


      /* VALIDATE PRODUCT */

      if (!product || !ageType || !quantityUnit) {
        alert(
          "Please select a product, age/type and quantity unit."
        );

        return;
      }


      /* VALIDATE DELIVERY */

      if (!delivery) {
        alert("Please select delivery or farm pickup.");
        return;
      }

      if (delivery === "Delivery" && !location) {
        alert("Please enter the delivery location.");

        locationInput.focus();

        return;
      }


      /* VALIDATE ADVANCE BOOKING DATE */

      if (isBooking && !preferredDate) {
        alert(
          "Please choose your preferred date for the advance booking."
        );

        preferredDateInput.focus();

        return;
      }


      /* PREVENT DUPLICATE SUBMISSIONS */

      if (submitOrderButton) {
        submitOrderButton.disabled = true;

        submitOrderButton.textContent = "Submitting...";
      }


      try {
        await waitForFirebase();


        /* PREPARE FIREBASE ORDER DATA */

        const orderData = {
          name: name,

          phone: phone,

          product: product,

          ageType: ageType,

          quantity: quantity,

          quantityUnit: quantityUnit,

          orderType: isBooking
            ? "booking"
            : "order",

          preferredDate: preferredDate || "",

          delivery: delivery,

          location: location,

          message: message,

          status: isBooking
            ? "pending"
            : "new",

          createdAt: window.firebaseServerTimestamp()
        };


        /* SAVE ORDER OR BOOKING TO FIREBASE */

        const savedOrder = await window.firebaseAddDoc(
          window.firebaseCollection(
            window.firebaseDB,
            "orders"
          ),
          orderData
        );


        console.log(
          "Order or booking saved to Firebase:",
          savedOrder.id
        );


        /* PREPARE EMAIL VARIABLES */

        const emailParams = {
          order_id: savedOrder.id,

          order_type: isBooking
            ? "Booking Request"
            : "New Order",

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


        /* SEND EMAIL NOTIFICATION */

        const emailResult = await sendOrderEmail(emailParams);


        /* CUSTOMER CONFIRMATION */

        if (isBooking) {
          alert(
            "Your booking request has been saved successfully.\n\n" +
            "Booking reference: " + savedOrder.id +
            "\n\nNADUFEMG FARM will contact you to confirm availability."
          );
        } else {
          alert(
            "Your order has been saved successfully.\n\n" +
            "Order reference: " + savedOrder.id +
            "\n\nNADUFEMG FARM will contact you to confirm the details."
          );
        }


        /* REPORT EMAIL STATUS IN CONSOLE */

        if (!emailResult.success) {
          console.warn(
            "The order was saved, but the email notification was not confirmed. Check the EmailJS setup."
          );
        }


        /* RESET FORM AFTER SUCCESSFUL SAVE */

        orderForm.reset();

        updateProductOptions();

        updateOrderTypeSettings();

        updateDeliverySettings();


        /*
          IMPORTANT:
          There is intentionally NO WhatsApp redirect here.
          The customer stays on the website after submission.
        */

      } catch (error) {
        console.error(
          "Order or booking submission error:",
          error
        );

        alert(
          "Sorry, your order or booking could not be saved.\n\n" +
          "Please check your internet connection and try again.\n\n" +
          "Details: " + error.message
        );

      } finally {
        if (submitOrderButton) {
          submitOrderButton.disabled = false;

          updateOrderTypeSettings();
        }
      }
    }
  );
}


/* =========================================================
   CUSTOMER REVIEW FORM
   ========================================================= */

function setupReviewForm() {
  const reviewForm = document.getElementById("reviewForm");

  if (!reviewForm) {
    return;
  }

  reviewForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const name =
        document.getElementById("reviewName").value.trim();

      const product =
        document.getElementById("reviewProduct").value;

      const rating =
        document.getElementById("rating").value;

      const comment =
        document.getElementById("reviewComment").value.trim();


      /* VALIDATE RATING */

      if (!rating) {
        alert("Please select a rating ⭐");
        return;
      }


      /* VALIDATE REQUIRED FIELDS */

      if (!name || !product || !comment) {
        alert(
          "Please complete all the required review fields."
        );

        return;
      }


      try {
        await waitForFirebase();


        /* SAVE REVIEW AS PENDING */

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

            approved: false,

            status: "pending",

            createdAt: window.firebaseServerTimestamp()
          }
        );


        alert(
          "Thank you for your review!\n\n" +
          "Your review has been submitted and is waiting for admin approval."
        );


        /* RESET REVIEW FORM */

        reviewForm.reset();


        /* RESET STAR DISPLAY */

        const stars =
          document.querySelectorAll(".stars-input button");

        stars.forEach(function (star) {
          star.classList.remove("active");
        });

        const ratingInput =
          document.getElementById("rating");

        if (ratingInput) {
          ratingInput.value = "";
        }

      } catch (error) {
        console.error(
          "Review submission error:",
          error
        );

        alert(
          "Sorry, your review could not be submitted.\n\n" +
          "Please check your connection and try again."
        );
      }
    }
  );
}


/* =========================================================
   LOAD APPROVED CUSTOMER REVIEWS
   ========================================================= */

async function loadApprovedReviews() {
  const reviewsContainer =
    document.getElementById("reviewsContainer");

  if (!reviewsContainer) {
    return;
  }


  try {
    await waitForFirebase();


    /* GET ONLY APPROVED REVIEWS */

    const reviewsQuery = window.firebaseQuery(
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
      await window.firebaseGetDocs(reviewsQuery);


    /* CLEAR PLACEHOLDER */

    reviewsContainer.innerHTML = "";


    /* HANDLE EMPTY REVIEWS */

    if (reviewsSnapshot.empty) {
      const emptyCard = document.createElement("div");

      emptyCard.className = "review-card";

      const emptyMessage = document.createElement("p");

      emptyMessage.textContent =
        "No approved customer reviews yet.";

      const farmName = document.createElement("strong");

      farmName.textContent = "NADUFEMG FARM";

      emptyCard.appendChild(emptyMessage);

      emptyCard.appendChild(farmName);

      reviewsContainer.appendChild(emptyCard);

      return;
    }


    /* DISPLAY APPROVED REVIEWS */

    reviewsSnapshot.forEach(function (documentSnapshot) {
      const review = documentSnapshot.data();

      const reviewCard =
        document.createElement("div");

      reviewCard.className = "review-card";


      /* STAR RATING */

      const starsElement =
        document.createElement("div");

      starsElement.className = "stars";

      const rating = Math.max(
        0,
        Math.min(
          5,
          Number(review.rating) || 0
        )
      );

      starsElement.textContent =
        "⭐".repeat(rating);


      /* CUSTOMER COMMENT */

      const commentElement =
        document.createElement("p");

      commentElement.textContent =
        String(review.comment || "");


      /* CUSTOMER NAME */

      const nameElement =
        document.createElement("strong");

      nameElement.textContent =
        String(review.name || "Customer");


      /* PURCHASED PRODUCT */

      const productElement =
        document.createElement("p");

      productElement.textContent =
        "Purchased: " +
        String(review.product || "Not specified");


      /* ADD ELEMENTS TO CARD */

      reviewCard.appendChild(starsElement);

      reviewCard.appendChild(commentElement);

      reviewCard.appendChild(nameElement);

      reviewCard.appendChild(productElement);


      /* ADD CARD TO WEBSITE */

      reviewsContainer.appendChild(reviewCard);
    });

  } catch (error) {
    console.error(
      "Loading approved reviews failed:",
      error
    );

    reviewsContainer.innerHTML = "";

    const errorCard =
      document.createElement("div");

    errorCard.className = "review-card";

    const errorMessage =
      document.createElement("p");

    errorMessage.textContent =
      "Unable to load reviews. Please check your internet connection and try again.";

    errorCard.appendChild(errorMessage);

    reviewsContainer.appendChild(errorCard);
  }
}


/* =========================================================
   INITIALIZE WEBSITE
   ========================================================= */

function initializeWebsite() {
  console.log(
    "NADUFEMG FARM website JavaScript is running."
  );

  setupStarRating();

  setupReviewForm();


  /* LOAD APPROVED REVIEWS */

  if (window.firebaseDB) {
    loadApprovedReviews();
  } else {
    window.addEventListener(
      "firebaseReady",
      function () {
        loadApprovedReviews();
      },
      { once: true }
    );
  }
}


/* =========================================================
   START WEBSITE
   ========================================================= */

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeWebsite
  );
} else {
  initializeWebsite();
}
