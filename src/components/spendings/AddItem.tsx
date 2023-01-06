import dayjs from 'dayjs';
import AddItemModal from '../modal/Modal';

import { Formik } from 'formik';
import { collection, addDoc } from '@firebase/firestore';
import { handleSpendingInputs } from '../../screens/helpers';
import { db } from '../../config/firebase';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  useMediaQuery
} from '@mui/material';

type AddItemProps = {
  modalOpen: boolean;
  getItems: () => void;
  setModalOpen: (value: boolean) => void;
};

export const AddItem = (props: AddItemProps) => {
  const { modalOpen, getItems, setModalOpen } = props;
  const spendingsCollectionRef = collection(db, 'spendings');
  const matches = useMediaQuery('(max-width:500px)');
  const magazynInputs = handleSpendingInputs();

  const initialValues = {
    elementName: '',
    amount: '',
    addedBy: '',
    createdAt: dayjs().format()
  };

  return (
    <AddItemModal open={modalOpen}>
      <Formik
        initialValues={initialValues}
        validate={(values) => {
          const errors = {} as any;
          if (!values.addedBy) {
            errors.addedBy = 'Wartość wymagana!';
          }

          if (!values.amount) {
            errors.amount = 'Podaj kwotę wydatku!';
          }

          if (!values.elementName) {
            errors.elementName = 'Podaj nazwę wydatku!';
          }

          return errors;
        }}
        onSubmit={async (values, { setSubmitting }) => {
          await addDoc(spendingsCollectionRef, {
            elementName: values.elementName,
            amount: parseFloat(values.amount),
            addedBy: values.addedBy,
            createdAt: values.createdAt
          });

          getItems();
          setSubmitting(false);
          setModalOpen(false);
        }}
      >
        {({ values, setFieldValue, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
          return (
            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  {magazynInputs.map((input, index) => {
                    return (
                      <Box
                        sx={{
                          gridColumn: matches ? 'span 4' : input.fullWidth ? 'span 4' : 'span 2'
                        }}
                        key={index}
                      >
                        {input.type === 'select' ? (
                          <FormControl fullWidth>
                            <InputLabel
                              id="demo-simple-select-label"
                              //@ts-ignore
                              error={touched[input.name] && Boolean(errors[input.name])}
                            >
                              {input.label}
                            </InputLabel>
                            <Select
                              labelId="demo-simple-select-label"
                              id="demo-simple-select"
                              //@ts-ignore
                              value={values[input.name]}
                              //@ts-ignore
                              error={touched[input.name] && Boolean(errors[input.name])}
                              label={input.label}
                              onChange={(d) => {
                                setFieldValue(input.name, d.target.value);
                              }}
                            >
                              {input.options?.map((option) => {
                                return (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                            {/* @ts-ignore */}
                            {touched[input.name] && Boolean(errors[input.name]) ? (
                              <FormHelperText sx={{ color: 'red' }}>
                                {/* @ts-ignore */}
                                {errors[input.name]}
                              </FormHelperText>
                            ) : null}
                          </FormControl>
                        ) : (
                          <TextField
                            type={input.type}
                            name={input.name}
                            label={input.label}
                            variant="outlined"
                            //@ts-ignore
                            error={touched[input.name] && Boolean(errors[input.name])}
                            //@ts-ignore
                            helperText={touched[input.name] && errors[input.name]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            //@ts-ignore
                            value={values[input.name]}
                            fullWidth
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px' }}>
                  <Button
                    variant="outlined"
                    sx={{ mr: '10px' }}
                    color="error"
                    onClick={() => setModalOpen(false)}
                    size="small"
                  >
                    Zamknij
                  </Button>
                  <Button variant="outlined" size="small" type="submit" disabled={isSubmitting}>
                    Zapisz
                  </Button>
                </Box>
              </Box>
            </form>
          );
        }}
      </Formik>
    </AddItemModal>
  );
};
