import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the Clarity VM environment
const mockClarity = {
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
    sponsorAddress: null,
  },
  contracts: {
    "supplier-verification": {
      functions: {
        "register-supplier": vi.fn(),
        "verify-supplier": vi.fn(),
        "update-supplier-rating": vi.fn(),
        "get-supplier": vi.fn(),
        "is-verified": vi.fn(),
      },
    },
  },
  blockHeight: 100,
}

// Setup global mock
vi.mock("clarity-vm", () => ({
  callReadOnlyFunction: (contract: string, fn: string, args: any[]) => {
    return mockClarity.contracts[contract].functions[fn](...args)
  },
  callPublicFunction: (contract: string, fn: string, args: any[]) => {
    return mockClarity.contracts[contract].functions[fn](...args)
  },
  getBlockHeight: () => mockClarity.blockHeight,
  getTxSender: () => mockClarity.tx.sender,
}))

describe("Supplier Verification Contract", () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks()
    
    // Setup default mock responses
    mockClarity.contracts["supplier-verification"].functions["register-supplier"].mockReturnValue({
      success: true,
      result: { value: true },
    })
    
    mockClarity.contracts["supplier-verification"].functions["get-supplier"].mockReturnValue({
      success: true,
      result: {
        value: {
          principal: mockClarity.tx.sender,
          name: "Test Supplier",
          verified: false,
          "verification-date": 0,
          industry: "Manufacturing",
          rating: 0,
        },
      },
    })
    
    mockClarity.contracts["supplier-verification"].functions["is-verified"].mockReturnValue({
      success: true,
      result: { value: false },
    })
  })
  
  it("should register a new supplier", async () => {
    const result = await mockClarity.contracts["supplier-verification"].functions["register-supplier"](
        "SUP123",
        "Test Supplier",
        "Manufacturing",
    )
    
    expect(result.success).toBe(true)
    expect(mockClarity.contracts["supplier-verification"].functions["register-supplier"]).toHaveBeenCalledWith(
        "SUP123",
        "Test Supplier",
        "Manufacturing",
    )
  })
  
  it("should verify a supplier", async () => {
    mockClarity.contracts["supplier-verification"].functions["verify-supplier"].mockReturnValue({
      success: true,
      result: { value: true },
    })
    
    const result = await mockClarity.contracts["supplier-verification"].functions["verify-supplier"]("SUP123")
    
    expect(result.success).toBe(true)
    expect(mockClarity.contracts["supplier-verification"].functions["verify-supplier"]).toHaveBeenCalledWith("SUP123")
  })
  
  it("should update supplier rating", async () => {
    mockClarity.contracts["supplier-verification"].functions["update-supplier-rating"].mockReturnValue({
      success: true,
      result: { value: true },
    })
    
    const result = await mockClarity.contracts["supplier-verification"].functions["update-supplier-rating"]("SUP123", 8)
    
    expect(result.success).toBe(true)
    expect(mockClarity.contracts["supplier-verification"].functions["update-supplier-rating"]).toHaveBeenCalledWith(
        "SUP123",
        8,
    )
  })
  
  it("should get supplier information", async () => {
    const result = await mockClarity.contracts["supplier-verification"].functions["get-supplier"]("SUP123")
    
    expect(result.success).toBe(true)
    expect(result.result.value).toEqual({
      principal: mockClarity.tx.sender,
      name: "Test Supplier",
      verified: false,
      "verification-date": 0,
      industry: "Manufacturing",
      rating: 0,
    })
  })
  
  it("should check if supplier is verified", async () => {
    const result = await mockClarity.contracts["supplier-verification"].functions["is-verified"]("SUP123")
    
    expect(result.success).toBe(true)
    expect(result.result.value).toBe(false)
    
    // Now test with a verified supplier
    mockClarity.contracts["supplier-verification"].functions["is-verified"].mockReturnValue({
      success: true,
      result: { value: true },
    })
    
    const verifiedResult = await mockClarity.contracts["supplier-verification"].functions["is-verified"]("SUP123")
    
    expect(verifiedResult.success).toBe(true)
    expect(verifiedResult.result.value).toBe(true)
  })
})

