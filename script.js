const siteHeader = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const bookingForm = document.getElementById("booking-form");
const formNote = document.getElementById("form-note");
const dateInput = bookingForm?.querySelector('input[name="date"]');

if (dateInput) {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  const localDate = new Date(today.getTime() - timezoneOffset).toISOString().split("T")[0];
  dateInput.min = localDate;
}

if (navToggle && siteHeader) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    siteHeader?.classList.remove("nav-open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

if (bookingForm && formNote) {
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(bookingForm);
    const guestName = formData.get("name");
    const bookingDate = formData.get("date");
    const guests = formData.get("guests");

    formNote.textContent = `Спасибо, ${guestName}. Заявка на ${bookingDate} для ${guests.toString().toLowerCase()} получена. Мы скоро свяжемся с вами.`;
    bookingForm.reset();

    if (dateInput) {
      dateInput.min = dateInput.min;
    }
  });
}
