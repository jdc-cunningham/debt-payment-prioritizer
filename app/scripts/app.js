let modalVisible = false;

const addBtn = document.getElementById('add-debt__header-btn');
const modalContainer = document.getElementById('add-debt-modal-container');
const modalContainerCloseBtn = document.getElementById('form-debt-cancel'); // always exists in dom
const modalForm = document.getElementById('add-debt-modal');
const modalFormAddBtn = document.getElementById('form-debt-save-btn');
const dataStore = localStorage; // heh
const appBody = document.getElementById('app-body');

// basic modal logic

const toggleModal = () => {
  if (modalVisible) {
    modalVisible = false;
    modalContainer.classList = 'hidden';
  } else {
    modalVisible = true;
    modalContainer.classList = '';
  }
}

addBtn.addEventListener('click', toggleModal);
modalContainerCloseBtn.addEventListener('click', toggleModal);

// adding debts

const getFormFields = () =>
  Array.from(modalForm.querySelectorAll('input')).map(input =>
    ({
      name: input.getAttribute('name'),
      val: input.value
    })
  )

const processForm = () => {
  const formValues = getFormFields();
  
  if (
    !formValues[0].val
    || !formValues[1].val
    || !formValues[2].val
  ) {
    alert('Please make sure the 3 required fields: Name, Bal, APR are filled in.');
    return;
  }

  const curData = JSON.parse(dataStore.getItem('finfinite')) || [];

  if (curData.length) {
    curData.push([formValues]);
    dataStore.setItem('finfinite', JSON.stringify(formValues));
  } else { // first save
    dataStore.setItem('finfinite', JSON.stringify(formValues));
  }

  renderCards(); // re-render
}

modalFormAddBtn.addEventListener('click', () => {
  processForm();
});

// rendering debts

const createCard = ({
  name,
  bal,
  apr,
  dueDay,
  minPay,
  youPay,
  yearlyDebtGrowth,
  monthlyDebtGrowth,
  dailyDebtGrowth,
  realTimeGrowth
}) => (
  `<div class="debt-card">
    <h2>Name: ${name}</h2>
    <h3>Balance: ${bal}</h3>
    <h3>APR: ${apr}</h3>
    <h3>Due day: ${dueDay}</h3>
    <h3>Min pay: ${minPay}</h3>
    <h3>You pay: ${youPay}</h3>
    <h3>Yearly debt growth: ${yearlyDebtGrowth}</h3>
    <h3>Monthly debt growth: ${monthlyDebtGrowth}</h3>
    <h3>Daily debt growth: ${dailyDebtGrowth}</h3>
    <h3>Real time growth: ${realTimeGrowth}</h3>
  </div>`
);

const renderCards = () => {
  // check for and render existing entries
  const curData = JSON.parse(dataStore.getItem('finfinite')) || [];

  console.log(curData);

  if (curData.length) {
    appBody.innerHtml = '';

    curData.forEach(debt => {
      const card = createCard(
        debt.name,
        debt.bal,
        debt.apr,
        debt.dueDay,
        debt.minPay
      );

      appBody.innerHTML += card;
    });
  }
}

renderCards();