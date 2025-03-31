;; Supplier Verification Contract
;; This contract validates the legitimacy of vendors in the supply chain

;; Define data variables
(define-data-var admin principal tx-sender)
(define-map suppliers
  { supplier-id: (string-utf8 36) }
  {
    principal: principal,
    name: (string-utf8 100),
    verified: bool,
    verification-date: uint,
    industry: (string-utf8 50),
    rating: uint
  }
)

;; Error codes
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_ALREADY_VERIFIED u2)
(define-constant ERR_SUPPLIER_NOT_FOUND u3)

;; Read-only functions
(define-read-only (get-supplier (supplier-id (string-utf8 36)))
  (map-get? suppliers { supplier-id: supplier-id })
)

(define-read-only (is-verified (supplier-id (string-utf8 36)))
  (default-to false (get verified (get-supplier supplier-id)))
)

(define-read-only (get-admin)
  (var-get admin)
)

;; Public functions
(define-public (register-supplier
    (supplier-id (string-utf8 36))
    (name (string-utf8 100))
    (industry (string-utf8 50))
  )
  (let ((supplier-data {
      principal: tx-sender,
      name: name,
      verified: false,
      verification-date: u0,
      industry: industry,
      rating: u0
    }))
    (ok (map-set suppliers { supplier-id: supplier-id } supplier-data))
  )
)

(define-public (verify-supplier (supplier-id (string-utf8 36)))
  (let ((supplier (get-supplier supplier-id)))
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (asserts! (is-some supplier) (err ERR_SUPPLIER_NOT_FOUND))

    (ok (map-set suppliers
      { supplier-id: supplier-id }
      (merge (unwrap-panic supplier) {
        verified: true,
        verification-date: block-height,
        rating: u5
      })
    ))
  )
)

(define-public (update-supplier-rating (supplier-id (string-utf8 36)) (new-rating uint))
  (let ((supplier (get-supplier supplier-id)))
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (asserts! (is-some supplier) (err ERR_SUPPLIER_NOT_FOUND))
    (asserts! (and (>= new-rating u0) (<= new-rating u10)) (err u4))

    (ok (map-set suppliers
      { supplier-id: supplier-id }
      (merge (unwrap-panic supplier) {
        rating: new-rating
      })
    ))
  )
)

(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (ok (var-set admin new-admin))
  )
)

