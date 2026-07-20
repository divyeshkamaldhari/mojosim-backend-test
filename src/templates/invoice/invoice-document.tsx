import { Document, Image, Page, Text, View } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

import type { InvoicePdfInput } from '../../utils/generate-invoice-pdf'
import { invoiceStyles } from './invoice-theme'

type InvoiceDocumentProps = {
  input: InvoicePdfInput
  logoSrc: string | null
}

const formatIssuedDate = (date: Date): string => {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const year = String(date.getUTCFullYear())
  return `${month}-${day}-${year}`
}

const MetaLine = ({
  label,
  value,
}: {
  label: string
  value: string
}): ReactElement => (
  <Text style={invoiceStyles.metaText}>
    <Text style={invoiceStyles.metaBold}>{label}</Text>
    {'  '}
    {value}
  </Text>
)

const PaymentDetailRow = ({
  label,
  value,
}: {
  label: string
  value: string
}): ReactElement => (
  <View style={invoiceStyles.paymentRow}>
    <Text style={invoiceStyles.paymentLabel}>{label}</Text>
    <Text style={invoiceStyles.paymentValue}>{value}</Text>
  </View>
)

export const InvoiceDocument = ({
  input,
  logoSrc,
}: InvoiceDocumentProps): ReactElement => {
  const issuedDate = formatIssuedDate(input.issuedAt)
  const orderRef = `#${String(input.orderId)}`
  // const issuerTrimmed = input.issuerName.trim()

  return (
    <Document>
      <Page size="A4" style={invoiceStyles.page}>
        <View style={invoiceStyles.outerCard}>
          <View style={invoiceStyles.headerSection}>
            <View style={invoiceStyles.headerRow}>
              <View>
                {logoSrc !== null ? (
                  <Image src={logoSrc} style={invoiceStyles.logo} />
                ) : (
                  <Text style={invoiceStyles.brandTitle}>mojoSim</Text>
                )}
                <Text style={invoiceStyles.subtitle}>
                  Official invoice for your mojoSim purchase.
                </Text>
                {/* {issuerTrimmed.length > 0 ? (
                  <Text style={invoiceStyles.issuer}>{issuerTrimmed}</Text>
                ) : null} */}
              </View>
              <View style={invoiceStyles.headerRight}>
                <View style={invoiceStyles.invoiceBadge}>
                  <Text style={invoiceStyles.invoiceBadgeText}>INVOICE</Text>
                </View>
                <MetaLine label="No:" value={input.invoiceNumber} />
                <MetaLine label="Issued:" value={issuedDate} />
                <MetaLine label="Order:" value={orderRef} />
              </View>
            </View>
          </View>

          <View style={invoiceStyles.bodySection}>
            <View style={invoiceStyles.twoColRow}>
              <View style={invoiceStyles.card}>
                <Text style={invoiceStyles.cardLabel}>BILLED TO</Text>
                <Text style={invoiceStyles.cardName}>{input.customerName}</Text>
                <Text style={invoiceStyles.cardEmail}>
                  {input.customerEmail}
                </Text>
              </View>
              <View style={invoiceStyles.cardLast}>
                <View style={invoiceStyles.paymentHeaderRow}>
                  <Text style={invoiceStyles.cardLabel}>PAYMENT</Text>
                  <View style={invoiceStyles.paidBadge}>
                    <Text style={invoiceStyles.paidBadgeText}>Paid</Text>
                  </View>
                </View>
                <View style={invoiceStyles.paymentDivider}>
                  <PaymentDetailRow label="Currency" value={input.currency} />
                  <PaymentDetailRow
                    label="Method"
                    value={input.paymentGateway}
                  />
                  <PaymentDetailRow label="Issued" value={issuedDate} />
                  <PaymentDetailRow label="Order Ref" value={orderRef} />
                </View>
              </View>
            </View>

            <View style={invoiceStyles.lineTable}>
              <View style={invoiceStyles.lineTableHeader}>
                <View style={invoiceStyles.lineTableHeaderColDesc}>
                  <Text style={invoiceStyles.lineTableHeaderText}>
                    DESCRIPTION
                  </Text>
                </View>
                <View style={invoiceStyles.lineTableHeaderColAmt}>
                  <Text style={invoiceStyles.lineTableHeaderText}>AMOUNT</Text>
                </View>
              </View>
              <View style={invoiceStyles.lineTableBody}>
                <View style={invoiceStyles.lineDescCol}>
                  <View style={invoiceStyles.linePlanRow}>
                    {input.lineItem.flagUrl ? (
                      <Image
                        src={input.lineItem.flagUrl}
                        style={invoiceStyles.lineFlag}
                      />
                    ) : null}
                    <Text style={invoiceStyles.lineTitle}>
                      {input.lineItem.destinationLabel ? (
                        <>
                          <Text style={invoiceStyles.lineDestination}>
                            {input.lineItem.destinationLabel}
                          </Text>
                          {' · '}
                          {input.lineItem.planName}
                        </>
                      ) : (
                        input.lineItem.planName
                      )}
                    </Text>
                  </View>
                </View>
                <View style={invoiceStyles.lineAmtCol}>
                  <Text style={invoiceStyles.lineAmount}>
                    {input.currency} {input.subtotal}
                  </Text>
                </View>
              </View>
            </View>

            <View style={invoiceStyles.totalsWrap}>
              <View style={invoiceStyles.totalsBox}>
                <View style={invoiceStyles.totalsRows}>
                  <View style={invoiceStyles.totalRow}>
                    <Text style={invoiceStyles.totalLabel}>Subtotal</Text>
                    <Text>
                      {input.currency} {input.subtotal}
                    </Text>
                  </View>
                  {input.discountAmount !== undefined &&
                  input.discountAmount !== null &&
                  Number.parseFloat(input.discountAmount) > 0 ? (
                    <View style={invoiceStyles.totalRow}>
                      <Text style={invoiceStyles.totalLabel}>Discount</Text>
                      <Text>
                        -{input.currency} {input.discountAmount}
                      </Text>
                    </View>
                  ) : null}
                  <View style={invoiceStyles.totalRow}>
                    <Text style={invoiceStyles.totalLabel}>Tax</Text>
                    <Text>
                      {input.currency} {input.taxAmount}
                    </Text>
                  </View>
                </View>
                <View style={invoiceStyles.totalsFooter}>
                  <Text style={invoiceStyles.totalGrandLabel}>Total</Text>
                  <Text style={invoiceStyles.totalGrandValue}>
                    {input.currency} {input.totalAmount}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={invoiceStyles.footer}>
              This invoice was generated automatically by mojoSim and is valid
              without a handwritten signature.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
