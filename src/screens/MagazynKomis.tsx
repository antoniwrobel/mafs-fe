import { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Center from '../components/utils/Center';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CheckCircleSharpIcon from '@mui/icons-material/CheckCircleSharp';

import { auth, db } from '../config/firebase';
import { ItemType, SettlementItemType, SpendingType, ValveType } from './types';
import { collection, getDocs, addDoc, updateDoc, doc } from '@firebase/firestore';
import { AddItem } from '../components/inventory/AddItem';
import { EditItem } from '../components/inventory/EditItem';
import { AddToValveModal } from '../components/inventory/AddToValveModal';
import { ConfirmationModal } from '../components/modal/ConfirmationModal';
import { isAdminUser } from './helpers';

import dayjs from 'dayjs';
import { styled, Tooltip, tooltipClasses, TooltipProps } from '@mui/material';

const MagazynKomis = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [valveModalOpen, setValveModalOpen] = useState(false);

  const [returnConfirmationOpen, setReturnConfirmationOpen] = useState<string | null>(null);

  const [currentSelected, setCurrentSelected] = useState<ItemType>();
  const [items, setItems] = useState<ItemType[]>([]);
  const [user] = useState(auth.currentUser);

  const itemsCollectionRef = collection(db, 'items');
  const spendingsCollectionRef = collection(db, 'spendings');
  const valveCollectionRef = collection(db, 'valve');
  const settlementsCollectionRef = collection(db, 'settlements');
  const [showDeleted, setShowDeleted] = useState(false);

  const editBlocked = !isAdminUser(user);

  const getItems = async () => {
    const data = await getDocs(itemsCollectionRef);
    const items = data.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ItemType[];

    setItems(items);
  };

  useEffect(() => {
    getItems();
  }, []);

  const editRow = (itemId: string) => {
    const selectedItem = items.find((item) => item.id === itemId);

    if (selectedItem) {
      setCurrentSelected(selectedItem);
      setEditModalOpen(true);
    }
  };

  const handleValve = (itemId: string) => {
    const selectedItem = items.find((item) => item.id === itemId);

    if (selectedItem) {
      setCurrentSelected(selectedItem);
      setValveModalOpen(true);
    }
  };

  const handleReturn = async (item: ItemType) => {
    const { id, productName, provision } = item;

    const itemDoc = doc(db, 'items', id);

    const valveDoc = await getDocs(valveCollectionRef);
    const valveElements = valveDoc.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as ValveType[];
    const valveItem = valveElements.filter((item) => item.elementId === id);

    if (valveItem.length) {
      const promises = valveItem.map((e) => {
        const finded = doc(db, 'valve', e.id);
        updateDoc(finded, {
          removed: true
        });
      });

      await Promise.all(promises);
    }

    const s = await getDocs(settlementsCollectionRef);
    const settlements = s.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as SettlementItemType[];
    const settlement = settlements.find((item) => item.elementId === id);

    const spend = await getDocs(spendingsCollectionRef);
    const spendings = spend.docs.map((doc) => ({ ...doc.data(), id: doc.id })) as SpendingType[];
    const spending = spendings.find((item) => item.elementId === id);

    if (settlement) {
      const settlementsDoc = doc(db, 'settlements', settlement.id);

      await updateDoc(settlementsDoc, {
        status: 'zwrot',
        removed: true,
        ...(item.provision &&
          item.provision > 0 && {
            details: currentSelected?.details
              ? currentSelected.details + ` - zwrot - poniesione koszta ${item.provision!.toFixed(2)}zł`
              : `zwrot - poniesione koszta: ${item.provision!.toFixed(2)}zł`
          })
      });
    }

    await updateDoc(itemDoc, {
      status: 'zwrot',
      color: '#fff',
      valueTransferedToValve: 0
    });

    if (provision && provision > 0) {
      if (!item.provisionPayed) {
        await addDoc(spendingsCollectionRef, {
          elementId: id,
          elementName: productName,
          amount: provision,
          addedBy: 'Stan',
          createdAt: dayjs().format()
        });
      } else {
        if (spending) {
          const spendingDoc = doc(db, 'spendings', spending.id);
          await updateDoc(spendingDoc, {
            addedBy: 'Stan'
          });
        }
      }
    }

    getItems();
  };

  const haveItems = items.filter((e) => !e.removed).length;

  const BootstrapTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} arrow classes={{ popper: className }} />
  ))(({ theme }) => ({
    [`& .${tooltipClasses.arrow}`]: {
      color: theme.palette.common.black
    },
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: theme.palette.common.black,
      fontSize: 16,
      whiteSpace: 'nowrap',
      maxWidth: '100%'
    }
  }));

  let summaryStan = 0;

  return (
    <Container sx={{ px: '0px !important', maxWidth: '100% !important', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        {!editBlocked && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px' }}>
            <Button variant="contained" onClick={() => setModalOpen(true)}>
              Dodaj
            </Button>
          </Box>
        )}

        {items.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '20px', mr: '16px' }}>
            <Button variant="contained" onClick={() => setShowDeleted((prev) => !prev)}>
              {!showDeleted ? 'Pokaż usunięte' : 'Schowaj usunięte'}
            </Button>
          </Box>
        ) : null}
      </Box>

      <AddItem modalOpen={modalOpen} setModalOpen={setModalOpen} getItems={getItems} />

      <EditItem
        currentSelected={currentSelected}
        setEditModalOpen={setEditModalOpen}
        editModalOpen={editModalOpen}
        getItems={getItems}
      />

      <AddToValveModal
        currentSelected={currentSelected}
        getItems={getItems}
        setValveModalOpen={setValveModalOpen}
        valveModalOpen={valveModalOpen}
      />

      <Center>
        {haveItems ? (
          <TableContainer component={Paper} sx={{ mt: '20px', overflowX: 'initial' }}>
            <Table
              sx={{
                minWidth: 1550,
                '& .MuiTableCell-root': {
                  borderLeft: '1px solid rgba(224, 224, 224, 1)'
                }
              }}
              stickyHeader
            >
              <TableHead
                sx={{
                  transform: 'translateY(70px)',
                  zIndex: '9999',
                  position: 'relative'
                }}
              >
                <TableRow>
                  <TableCell>Nazwa produktu</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    status
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    kwota <br />
                    zakupu
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    kwota <br />
                    sprzedazy
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    koszt <br />
                    wysyłki
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    zapłacono <br />
                    łącznie
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    prowizja <br /> od sprzedaży
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    saldo <br />
                    stan
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    saldo <br />
                    wojtek
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    data <br />
                    stworzenia
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    uwagi
                  </TableCell>
                  {!editBlocked ? (
                    <TableCell
                      align="right"
                      sx={{
                        minWidth: '300px'
                      }}
                    >
                      akcja
                    </TableCell>
                  ) : null}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow sx={{ height: '70px' }}>
                  <TableCell />
                </TableRow>
                {items
                  // @ts-ignore
                  .sort((a, b) => new Date(b.createDate) - new Date(a.createDate))
                  .map((item) => {
                    if (!showDeleted && item.removed) {
                      return;
                    }

                    summaryStan += item.clearingValueStan || 0;

                    const removedCellStyles =
                      item.status === 'zwrot'
                        ? {
                            textDecoration: 'line-through'
                          }
                        : {};

                    return (
                      <TableRow key={item.id} sx={{ backgroundColor: `${item.color}26` }}>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
                          }}
                        >
                          <BootstrapTooltip
                            title={item.productName}
                            placement="bottom-start"
                            arrow
                            sx={{ fontSize: '18px' }}
                          >
                            <Box
                              sx={{
                                maxWidth: '250px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {item.url ? (
                                <a href={item.url} target="_blank" rel="noreferrer">
                                  {item.productName}
                                </a>
                              ) : (
                                item.productName
                              )}
                            </Box>
                          </BootstrapTooltip>
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : item.status === 'sprzedano' ? 'green' : 'inherit',
                            fontWeight: 'bold'
                          }}
                        >
                          {item.status}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
                          }}
                        >
                          {item.purchaseAmount}zł
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
                          }}
                        >
                          {item.saleAmount ? `${item.saleAmount}zł` : '-'}{' '}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {item.sendCost ? `${item.sendCost}zł` : '-'}{' '}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          {item.status === 'sprzedano' ? item.sendCost + item.saleAmount + 'zł' : '-'}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit'
                          }}
                        >
                          <Box
                            sx={{ display: 'flex', justifyContent: item.provisionPayed ? 'space-between' : 'center' }}
                          >
                            {item.provision ? item.provision.toFixed(2) + 'zł' : '-'}
                            {item.provisionPayed ? (
                              <CheckCircleSharpIcon fontSize="small" sx={{ color: 'green ' }} />
                            ) : null}
                          </Box>
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
                          }}
                        >
                          {item.clearingValueStan ? `${item.clearingValueStan.toFixed(2)}zł` : '-'}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
                          }}
                        >
                          {item.clearingValueWojtek ? `${item.clearingValueWojtek.toFixed(2)}zł` : '-'}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            ...removedCellStyles
                          }}
                        >
                          {dayjs(item.createDate).format('DD/MM/YYYY')}
                        </TableCell>

                        <TableCell
                          align="right"
                          sx={{
                            color: item.status === 'zwrot' ? 'red' : 'inherit',
                            fontWeight: item.status === 'zwrot' ? 'bold' : 'inherit',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.details}
                        </TableCell>
                        {!editBlocked ? (
                          <>
                            <TableCell align="right">
                              {item.status === 'sprzedano' ? (
                                <>
                                  <>
                                    <ConfirmationModal
                                      handleConfirm={() => handleReturn(item)}
                                      open={returnConfirmationOpen === item.id}
                                      handleReject={() => setReturnConfirmationOpen(null)}
                                    />
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="error"
                                      onClick={() => setReturnConfirmationOpen(item.id)}
                                    >
                                      Zwrot
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="contained"
                                      type="submit"
                                      onClick={() => handleValve(item.id)}
                                      sx={{ ml: '20px' }}
                                    >
                                      $$$
                                    </Button>
                                  </>
                                </>
                              ) : null}

                              {!item.removed && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  type="submit"
                                  color={item.status === 'zwrot' ? 'error' : 'primary'}
                                  onClick={() => editRow(item.id)}
                                  sx={{ ml: '20px' }}
                                >
                                  Edytuj
                                </Button>
                              )}
                            </TableCell>
                          </>
                        ) : null}
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ my: '20px' }}>Brak danych</Box>
        )}
      </Center>

      <Box
        sx={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
          Podsumowanie
          <Box sx={{ fontWeight: 'bold', marginLeft: '10px', minWidth: '150px', textAlign: 'end' }}>
            {summaryStan.toFixed(2)}zł
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default MagazynKomis;
