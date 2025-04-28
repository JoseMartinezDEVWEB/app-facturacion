import React, { useState } from 'react';
import { Form, Radio, Space, Divider, Alert, Input, InputNumber, Button, Card, Row, Col } from 'antd';
import VerifoneTerminal from './VerifoneTerminal';
import CreditCardForm from './CreditCardForm';
import CashPaymentForm from './CashPaymentForm';

/**
 * Componente que gestiona las opciones de pago disponibles
 */
const PaymentOptionsForm = ({ amount, onPaymentComplete }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [reference] = useState(`ORDER-${Date.now()}`);
  const [error, setError] = useState(null);
  const [transferNumber, setTransferNumber] = useState('');
  const [transferAmount, setTransferAmount] = useState(amount || 0);
  const [form] = Form.useForm();

  const handlePaymentMethodChange = e => {
    setPaymentMethod(e.target.value);
    setError(null);
  };

  const handleTerminalPaymentComplete = (result) => {
    if (onPaymentComplete) {
      onPaymentComplete({
        method: 'verifone_terminal',
        ...result
      });
    }
  };

  const handleManualCardPaymentComplete = (cardData) => {
    if (onPaymentComplete) {
      onPaymentComplete({
        method: 'manual_card',
        transactionId: `MANUAL-${Date.now()}`,
        ...cardData
      });
    }
  };

  const handleCashPaymentComplete = (cashData) => {
    if (onPaymentComplete) {
      onPaymentComplete({
        method: 'cash',
        transactionId: `CASH-${Date.now()}`,
        ...cashData
      });
    }
  };

  const handleTransferPaymentComplete = () => {
    if (onPaymentComplete) {
      onPaymentComplete({
        method: 'transfer',
        transactionId: `TRANSFER-${Date.now()}`,
        transferNumber,
        amount: transferAmount
      });
    }
  };

  const handleCancelPayment = () => {
    setError('El pago ha sido cancelado por el usuario');
  };

  return (
    <Form layout="vertical" form={form}>
      <Form.Item label="Total a pagar" style={{ marginBottom: '20px' }}>
        <InputNumber 
          style={{ width: '100%' }} 
          value={amount} 
          disabled 
          formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
        />
      </Form.Item>

      <Form.Item label="Método de pago">
        <Radio.Group value={paymentMethod} onChange={handlePaymentMethodChange}>
          <Space direction="vertical">
            <Radio value="card">Tarjeta manual</Radio>
            <Radio value="verifone">Terminal de pago Verifone</Radio>
            <Radio value="cash">Efectivo</Radio>
            <Radio value="transfer">Transferencia</Radio>
          </Space>
        </Radio.Group>
      </Form.Item>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Divider />

      {paymentMethod === 'card' && (
        <CreditCardForm 
          onSubmit={handleManualCardPaymentComplete} 
          amount={amount}
        />
      )}

      {paymentMethod === 'verifone' && (
        <VerifoneTerminal 
          amount={amount} 
          onComplete={handleTerminalPaymentComplete}
          onCancel={handleCancelPayment}
        />
      )}

      {paymentMethod === 'cash' && (
        <CashPaymentForm
          amount={amount}
          onSubmit={handleCashPaymentComplete}
        />
      )}

      {paymentMethod === 'transfer' && (
        <Card title="Pago por Transferencia" bordered={false}>
          <Form.Item 
            label="Número de Transferencia" 
            rules={[{ required: true, message: 'Ingrese el número de transferencia' }]}
          >
            <Input 
              placeholder="Ingrese el número de referencia" 
              value={transferNumber}
              onChange={e => setTransferNumber(e.target.value)}
            />
          </Form.Item>
          
          <Form.Item 
            label="Cantidad Pagada"
            rules={[
              { required: true, message: 'Ingrese la cantidad pagada' },
              { type: 'number', min: amount, message: `El monto debe ser al menos $${amount?.toFixed(2)}` }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Ingrese el monto transferido"
              value={transferAmount}
              onChange={value => setTransferAmount(value)}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              min={amount}
            />
          </Form.Item>
          
          <Row justify="end">
            <Col>
              <Button 
                type="primary" 
                onClick={handleTransferPaymentComplete}
                disabled={!transferNumber || transferAmount < amount}
              >
                Confirmar Transferencia
              </Button>
            </Col>
          </Row>
        </Card>
      )}
    </Form>
  );
};

export default PaymentOptionsForm; 